(function() {

  var c = document.getElementById("hetCanvas");
  var offLeft = c.offsetLeft,
      offTop = c.offsetTop;

  var settings = { 
    "set" : 1,
    "width" : 100,
    "height" : 100,
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
        this.commit = function(x,y){
          canvas.ctx.fillStyle="#FFFFFF";
          canvas.ctx.fillRect(x,y,20,20);
        }
      }
    }

    var currentTool = new tools['Pixel']();
    var pub = {
      "commit":function(x,y){
        currentTool.commit(x,y);
      },
      "update":function(){
        console.log(settings['tool']);
        var name =  settings['tool'];
        console.log(name) 
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
      tool.update(); 
      controls.update(); 
      canvas.update();
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



