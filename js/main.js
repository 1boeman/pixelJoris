(function() {

  var c = document.getElementById("hetCanvas");
  var container = document.getElementById("canvas-container");
  var offLeft = container.offsetLeft,
      offTop = container.offsetTop;

  var settings = { 
    "set" : 1,
    "width" : 100,
    "height" : 100,
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
      "Pixel" : function(){
        this.commit = function(x,y){
          canvas.ctx.fillStyle="#FF0000";
          canvas.ctx.fillRect(x,y,10,10);
        }
      },
 
      "Grid" : function(){

        canvas.ctx.fillStyle="#FFFFFF";

        var $overlay = $('<canvas id="overlay" />');
        $('#canvas-container').append($overlay);
        $overlay[0].width = canvas.c.width;
        $overlay[0].height = canvas.c.height;
        var octx = $overlay[0].getContext('2d');
        var horizontalBlox = Math.ceil(canvas.c.width/settings.gridWidth);
        var verticalBlox = Math.ceil(canvas.c.height/settings.gridWidth);
        var block,i,j,x,y;  
        var virtualGrid = [];         
        octx.strokeStyle="green";
        for (i = 0; i < verticalBlox; i++) {
          for (j=0; j < horizontalBlox; j++) {
            x = (j * settings.gridWidth);
            y = (i * settings.gridWidth);

            octx.rect(x,y,settings.gridWidth,settings.gridWidth);   
            virtualGrid.push([x,y]); 
          }
        }
        
        octx.stroke();
 
        this.commit = function(x,y){
          // collision detection
          for (var i = 0; i < virtualGrid.length; i++){
            if ((x > virtualGrid[i][0] && x <= virtualGrid[i][0]+settings.gridWidth) // x-match
                  && (y > virtualGrid[i][1] && y <= virtualGrid[i][1]+settings.gridWidth)){ //ymatch           
              canvas.ctx.fillRect(virtualGrid[i][0],virtualGrid[i][1],
                settings.gridWidth,
                settings.gridWidth
              );
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
    
    $(document).mousedown(function(e){
      commitTool(e);
      drawing = true; 
    });

    $(document).mouseup(function(){
      drawing = false;
    })

    $(document).mousemove(function(e){
      if (drawing) commitTool(e); 
    });
    
    var commitTool = function(e){
      var x = e.pageX - offLeft,
          y = e.pageY - offTop;
      tool.commit(x,y);
    }

    var pub = {
      update:function(){}
    }    
    return pub; 
  })(tool);
 

  /* control panel */ 
  var controls = (function(editor) {
    var $inputs = $('input.control,select.control');
    var handlers = {
      setWidth : function() {
        broadCaster.set('width',this.value);
      },

      setHeight : function() {
        broadCaster.set('height',this.value);
      },
      
      setTool : function(){
        broadCaster.set('tool',this.value);
      }
    };

    $inputs.change(function(){ 
      handlers[$(this).data('handle')].apply(this);
    });  

    var pub = {
      update:function(){
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


  var broadCaster = (function(){
    var updateClient = function(){
      editor.update();
      controls.update(); 
      canvas.update();
      tool.update(); 
 
    };

    var set = function(name,value){
      settings[name] = value;
      $.ajax({
        "method":"POST",
        "url":"./server/",
        "data":settings
      }).done(function(resp){
          console.log(resp);
          updateClient();
      });
    };
 
    $.get('./server/',function(resp){
      for (var x in resp) settings[x] = resp[x];
      
      settings['set'] = 1; 
      updateClient();
      $('#main').css('opacity',1)
    });
    
    var pub = {
      "set":set
      
    }
    return pub; 
    
  }());


/*
  window.onbeforeunload = function() {
      return true;
  };

*/

})();



