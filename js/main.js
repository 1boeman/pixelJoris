(function() {

  var c = document.getElementById("hetCanvas");
  var container = document.getElementById("canvas-container");
  var offLeft = container.offsetLeft,
      offTop = container.offsetTop;
  var currentTool;
  var settings = { 
    "set" : 1,
    "width" : 1200,
    "height" : 750,
    "color" :'#FFFFFF', 
    "gridWidth" : 50,
    "tool" : "Grid",
  }; 
  
  var $textTool = $('#textTool');
  $textTool.find('textarea').click(function(e){e.stopPropagation()});

  var canvas = (function(c){
    var ctx = c.getContext('2d');
    var imgData;

    var copy = function(){
      imgData = canvas.ctx.getImageData(0,0,c.width,c.height);
    };

    var paste = function(){
      canvas.ctx.putImageData(imgData, 0,0)
    };
 
    var pub = {
      "c" : c,
      "ctx" : ctx,
      "update" : function(){
        copy();
        c.height = settings.height;
        c.width = settings.width;
        paste();
      }
    };

    return pub;
  })(c);
      
  var tool = (function(){
    var toolIsBusy = 0; 
    var tools = {
      "Text" : function(){
        this.commit = function(x,y){
          if (!toolIsBusy){
            toolIsBusy = 1;
            $textTool
              .css({'left':x + 'px','top':y + 'px'})
              .show()
              .find('textarea')
              .css({'font-size':settings.gridWidth+'px'}) 
          }
        } 
      },
      "Bucket" : function(){
        this.commit = function(x,y){
          if (!toolIsBusy){
            toolIsBusy = 1; 
            canvas.ctx.fillFlood(x,y);
            setTimeout(function(){
              toolIsBusy=0; 
            },800);
          }
        }      
      },
      "Pixel" : function(){
        var w = settings.gridWidth;
        this.commit = function(x,y){
          canvas.ctx.fillRect(x-(w/2),y-(w/2),w,w);
        }
      },
      "Circle" : function (){
        var w = settings.gridWidth;
        var threesixty = Math.PI*2;
        this.commit = function(x,y){
          canvas.ctx.beginPath();
          canvas.ctx.arc(x,y,w,0,threesixty,true)
          canvas.ctx.closePath();
          canvas.ctx.fill();
        }
      },
      "Grid" : function(){
        var w = Math.floor(parseFloat(settings.gridWidth));
        var $overlay = $('<canvas id="overlay" />');
        $('#canvas-container').append($overlay);
        $overlay[0].width = canvas.c.width;
        $overlay[0].height = canvas.c.height;
        var octx = $overlay[0].getContext('2d');
        var horizontalBlox = Math.ceil(canvas.c.width/w);
        var verticalBlox = Math.ceil(canvas.c.height/w);
        var block,i,j,x,y;  
        var virtualGrid = [];         
        octx.strokeStyle="green";
        for (i = 0; i < verticalBlox; i++) {
          for (j=0; j < horizontalBlox; j++) {
            x = (j * w);
            y = (i * w);
            octx.rect(x,y,w,w);   
            virtualGrid.push([x,y]); 
          }
        }
        
        octx.stroke();
 
        this.commit = function(x,y){
          // collision detection
          for (var i = 0; i < virtualGrid.length; i++){
            if ((x > virtualGrid[i][0] && x <= virtualGrid[i][0]+w) // x-match
                  && (y > virtualGrid[i][1] && y <= virtualGrid[i][1]+w)){ //ymatch           
              canvas.ctx.fillRect(virtualGrid[i][0]-1,virtualGrid[i][1]-1,w,w);
              break; 
            } 
          }
        }
      }
    };

    canvas.ctx.fillStyle=settings.color;
    currentTool = new tools[settings.tool]();
    var pub = {
      "commit":function(x,y){
        currentTool.commit(x,y);
      },
      "makeNotBusy":function(){
        toolIsBusy=0;
      },
      "update":function(){
        $('#overlay').remove();
        var name =  settings['tool'];
        canvas.ctx.fillStyle=settings.color;
        currentTool = new tools[name]();
      }
    };
    return pub;
  })();
  
 
  var editor = (function(tool) {
    var drawing = false;
    var $cc = $('#canvas-container');
    $cc.mousedown(function(e){
      history.store(); 
      drawing = true; 
      commitTool(e);
    });

    $(document).mouseup(function(e){
      drawing = false;
    });

    $cc.mousemove(function(e){
      if (drawing) commitTool(e); 
    });
    
    var commitTool = function(e){
      var x = e.pageX - offLeft,
          y = e.pageY - offTop;
      
      // check if event took place inside canvas area
      if ((x >= 0 && x <= settings.width)  && (y >= 0 && y <= settings.height)) {
        tool.commit(x,y);
      }
    };

    var pub = {
      update:function(){}
    };   
    return pub; 
  })(tool);
 
  /* control panel */ 
  var controls = (function(editor) {
    var $inputs = $('.controls .control');
    var $buttons = $('.control-group .button');
    var gallery_visible = false;
    var colorHistory = []; 
    var handlers = {
      "scale":function(){
        history.store(); 
        var c = canvas.ctx;
        var scale = parseFloat($('#schaal').val());
        var crop = $('#schaal-crop').get(0).checked;  
        var current = canvas.c.toDataURL(); 
        var img = new Image;
          img.onload = function(){
            c.beginPath();
            c.clearRect(0,0,settings.width,settings.height);
            c.scale(scale,scale);
            c.drawImage(img, 0, 0);
            if (crop){
              handlers.setWidth(settings.width*scale);
              handlers.setHeight(settings.height*scale);
            }
            c.scale(1/scale,1/scale);
          }
          img.src = current; 
      },
      "cancelText":function(){
        $textTool.hide();
        tool.makeNotBusy(); 
      },
      "commitText":function(){
        var textbox = $textTool;
        var position = textbox.position();
        canvas.ctx.font = settings.gridWidth+"px Arial";
        var lineheight = parseFloat(settings.gridWidth)+(settings.gridWidth/6);
        var ypos,txt = textbox.find('textarea').val().split('\n');
        for (var i=0; i < txt.length; i++){
          ypos = parseFloat(settings.gridWidth) + position.top + (i*lineheight);
          canvas.ctx.fillText(txt[i],position.left,ypos);
        }
        textbox.hide(); 
        tool.makeNotBusy(); 
      },
			"rotate":function(){
        var degrees = $('.rotation')[0].value;
        var img = new Image(); 
        img.onload = function(){
          history.store(); 
          canvas.ctx.clearRect(0,0,settings.width,settings.height);
          canvas.ctx.save();
          canvas.ctx.translate(settings.width/2,settings.height/2);
          canvas.ctx.rotate(degrees*Math.PI/180);
          canvas.ctx.drawImage(img,-img.width/2,-img.height/2);
          canvas.ctx.restore();
        }
      
        img.src = canvas.c.toDataURL(); 
			},

      "loadImage":function(){
        var img = new Image;
        img.onload = function(){
          canvas.ctx.beginPath();
          canvas.ctx.clearRect(0,0,settings.width,settings.height);
          canvas.ctx.drawImage(img, 0, 0);
        }
        
        img.src = $(this).data('src');

      },
      "showTranslate": function(){
        $('body').toggleClass('translate');
      },
      "translate": function(){
        history.store(); 
        var x = parseFloat($('#translate_x').val());
        var y = parseFloat($('#translate_y').val());
        var imgData = canvas.ctx.getImageData(0,0,settings.width, settings.height);
        var t = function(){
          canvas.ctx.clearRect(0,0,settings.width,settings.height);
          canvas.ctx.putImageData(imgData, x,y);
        }
        
        var newWidth = parseInt(settings.width)+x;
        var newHeight = parseInt(settings.height)+y;

        if (newWidth > settings.width || 
              newHeight > settings.height){
          handlers.setWidth(newWidth,function(){
            handlers.setHeight(newHeight,t);
          });
        } else {
          t(); 
        }
      },
      "noScroll": function(){   
        $('body').toggleClass('noScroll');
      },
      "gallery": function(){
        if (!gallery_visible){      
          gallery.show();
          gallery_visible = true;
        } else {
          gallery.hide();
          gallery_visible = false
        }
      },
      "saveFile": function(){
        broadCaster.save();     
      },
      "undo": function(){
        history.undo();  
      },
      "downloadFile": function(){
        var dt = canvas.c.toDataURL();
        this.href = dt;
      },
      "setGridWidth":function(){
        broadCaster.set('gridWidth',this.value); 
      },
      "setColor": function (){
        if (colorHistory.indexOf(this.value)== -1){
          colorHistory.push (this.value);
          if (colorHistory.length > 12) colorHistory.shift();
          var colorHistoryBlock = $('<div class="colorHistoryBlock" data-color="'+this.value+'" style="background:'+this.value+'" />');     
          colorHistoryBlock.click(function(){
            $('.color').val($(this).data('color')).trigger('change');
          });
          $('#colorHistory').prepend(colorHistoryBlock);
        }
        broadCaster.set('color',this.value); 
      },
      "setWidth" : function(w,callback) {
        var w = w || Math.ceil(parseFloat(this.value));
        w = w > 1 ? w : 1;  
        broadCaster.set('width',w,callback);
      },
      "setHeight" : function(h,callback) {
        var h = h || Math.ceil(parseFloat(this.value));
        h = h > 1 ? h : 1;  
        broadCaster.set('height',h,callback);
      },
      "setTool" : function(){
        broadCaster.set('tool',this.value);
      }
    };

    $inputs.change(function(e){ 
      handlers[$(this).data('handle')].apply(this);
    });  
    
    $buttons.click(function(e){ 
      e.stopPropagation();
      handlers[$(this).data('handle')].apply(this);
    });  
   
    var pub = {
      "handlers":handlers,
      "update":function(){
        $inputs.each(function(){
          var relevantSetting = $(this).data('source');
          if(settings[relevantSetting] != $(this).val()){
            $(this).val(settings[relevantSetting]);
          }  
        })
      }
    }
    return pub;
  })(editor);

  /* broadcaster tells other objects when settings are changed.
   * Also handles communications with server.
  */
  var broadCaster = (function(){
    var updateClient = function(resp,callback){
      var callback = callback || function(){};
      editor.update();
      controls.update(); 
      canvas.update();
      tool.update();
      callback(); 
    };

    var set = function(name,value,callback){
      var callback = callback || function(){};
      settings[name] = value;
      $.ajax({
        "method":"POST",
        "url":"./server/",
        "data":settings
      }).done(function(resp){
        updateClient(resp,callback);
      });
    };
    var save = function(){
      var optimize = true; 
      var dataUrl = canvas.c.toDataURL();  
      $.post(
        './server/',{
          "save":1,
          "dataUrl":dataUrl
      },function(resp){
        if (optimize){
          $.post('./server/',{
            "optimize":1
          });
        }
        alert('done') 
      });   
    };
    // initialize with settings 
    $.get('./server/',function(resp){
      for (var x in resp) settings[x] = resp[x];
      
      settings['set'] = 1; 
      updateClient();
      $('#main').css('opacity',1)
    });
    
    var pub = {
      "set":set,
      "save":save
    };
    return pub; 
  }());

  /* history undo redo */
  var history = (function(){
    var past = [];
    var pub = {
      store:function(){
        var current = canvas.c.toDataURL(); 
        // var previous = past.length ? past[past.length-1] : 0; 
        // if (previous && previous == current) return;
        past.push (current);
        if (past.length > 20) past.shift();
      },
      undo:function(){  
        if (past.length){
          var img = new Image;
          img.onload = function(){
            canvas.ctx.beginPath();
            canvas.ctx.clearRect(0,0,settings.width,settings.height);
            canvas.ctx.drawImage(img, 0, 0);
          }

          img.src = past.pop();
        }
      },
      redo:function(){

      }  
    };
    pub.store();
    return pub;
  })();

  var gallery = (function(){
    var hide = function(){
      $('body').removeClass('gallery');
    };

    var show = function(){
      $('body').addClass('gallery')
      $.get('./server/',{
        "gallery":1,
      },function(resp){
        var output = [],data;
        var template = $('#tpl_gallery').html();
        Mustache.parse(template);
        for (var date in resp){
          data = {"date" : date, "images":resp[date]};
          output.push(Mustache.render(template,data));
        }
        var $galcon =  $('.gallery-container');
        $galcon.html(output.join(''))
          .find('.edit-image-button')
          .click(function(){
            var button = this;
            if (confirm ('Open this image in Editor?')){
              var img = new Image;
              img.onload = function(){
                broadCaster.set('width',img.width);
                broadCaster.set('height',img.height,function(){
                  controls.handlers["loadImage"].apply(button);
                  controls.handlers["gallery"].apply(button);
                });
              }
              img.src = $(button).data('src');
            }
          });
          $galcon.find('.delete-image-button').click(function(){
            var button = this;  
            if (confirm('Delete this image?')){
              $.post('./server/',{"del":$(button).data('src')},
                function(resp){ 
                  var m = [];             
                  if (resp.length) {
                    for (var r in resp){
                      m.push (resp[r] + " was deleted.")
                    }
                    alert(m.join("\n"));
                    if (resp.length == 2){
                      $(button).parents('.images').hide();
                    } else {
                      $(button).parents('.gallery_item').hide();
                    }
                  } else {
                    alert('Nothing was deleted') 
                  } 
              },'json');
            }
          });

        $('.images img.lazy').lazyload({
          "effect":"fadeIn",
          "threshold" : 200
        });
      })
    };
    pub = {
      "show":show,
      "hide":hide
    }
    return pub;  
  })();
})();

window.onbeforeunload = function() {
    return true;
};
