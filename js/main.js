(function() {

  var c = document.getElementById("hetCanvas");
  var container = document.getElementById("canvas-container");
  var offLeft = container.offsetLeft,
      offTop = container.offsetTop;

  var settings = { 
    "set" : 1,
    "width" : 100,
    "height" : 100,
    "color" :'#FFFFFF', 
    "gridWidth" : 20,
    "tool" : "Pixel",
  }; 
  
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
    var tools = {
      "Bucket" : function(){
        canvas.ctx.fillStyle=settings.color;
        this.commit = function(x,y){
          canvas.ctx.fillFlood(x,y); 
        }      
      },
      "Pixel" : function(){
        canvas.ctx.fillStyle=settings.color;
        var w = settings.gridWidth;
        this.commit = function(x,y){
          canvas.ctx.fillRect(x-(w/2),y-(w/2),w,w);
        }
      },
 
      "Grid" : function(){
        canvas.ctx.fillStyle=settings.color;
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
              canvas.ctx.fillRect(virtualGrid[i][0]-1,virtualGrid[i][1]-1,w+1,w+1);
              break; 
            } 
          }
        }
      }
    }

    var currentTool = new tools[settings.tool]();
    var pub = {
      "commit":function(x,y){
        currentTool.commit(x,y);
      },
      "update":function(){
        $('#overlay').remove();
        var name =  settings['tool'];
        currentTool = new tools[name]();
      }
    }
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
      if ((x >= 0 && x <= settings.width)   
           && (y >= 0 && y <= settings.height)) {
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
    var $buttons = $('.controls .button');
    var gallery_visible = false;

    var handlers = {
      "loadImage":function(){
        var img = new Image;
        img.onload = function(){
          canvas.ctx.beginPath();
          canvas.ctx.clearRect(0,0,settings.width,settings.height);
          canvas.ctx.drawImage(img, 0, 0);
        }
        
        img.src = $(this).data('src');

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
      saveFile: function(){
        broadCaster.save();     
      },
      undo: function(){
        history.undo();  
      },
      downloadFile: function(){
        var dt = canvas.c.toDataURL();
        this.href = dt;
      },
      setGridWidth :function(){
        broadCaster.set('gridWidth',this.value); 
      },
      setColor : function (){
        var colorHistoryBlock = $('<div class="colorHistoryBlock" data-color="'+this.value+'" style="background:'+this.value+'" />');     
        colorHistoryBlock.click(function(){
          $('.color').val($(this).data('color')).trigger('change');
        });
        $('#colorHistory').prepend(colorHistoryBlock);
        broadCaster.set('color',this.value); 
      },
      setWidth : function() {
        var w = Math.ceil(parseFloat(this.value));
        w = w > 1 ? w : 1;  
        broadCaster.set('width',w);
      },
      setHeight : function() {
        var h = Math.ceil(parseFloat(this.value));
        h = h > 1 ? h : 1;  
        broadCaster.set('height',h);
      },
      setTool : function(){
        broadCaster.set('tool',this.value);
      }
    };

    $inputs.change(function(){ 
      handlers[$(this).data('handle')].apply(this);
    });  
    
    $buttons.click(function(){ 
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
      dataUrl = canvas.c.toDataURL();  
      $.post(
        './server/',{
          "save":1,
          "dataUrl":dataUrl
      },function(resp){
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
        if (past.length > 10) past.shift();
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
        $('.gallery-container')
          .html(output.join(''))
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

/*
  window.onbeforeunload = function() {
      return true;
  };

*/

})();



