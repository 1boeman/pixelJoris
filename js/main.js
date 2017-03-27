(function() {

  var c = document.getElementById("hetCanvas");
  var offLeft = c.offsetLeft,
      offTop = c.offsetTop;
  var ctx = c.getContext('2d');

  

  var Pixel = function(){
    this.commit = function(x,y,ctx){
      ctx.fillStyle="#FF0000";
      ctx.fillRect(x,y,10,10);
    }
  };
  var tool = new Pixel();


    

  
 
  var editor = (function(ctx,c,tool) {
    $(c).click(function(e){
      var x = e.pageX - offLeft,
          y = e.pageY - offTop;

      tool.commit(x,y,ctx);
    });

    

    var pub = {
      resize:function(w,h){
            

      }
    }    
    return pub; 
  })(ctx,c,tool);
  
  var controls = (function(editor) {
    var imgData; 
    var copy = function(){
      imgData = ctx.getImageData(0,0,c.width,c.height);
    };

    var paste = function(){
      ctx.putImageData(imgData, 0,0)
    };
    
    var handlers = {
      
      setWidth : function() {
        copy();
        c.width = this.value;
        paste();
      },

      setHeight : function() {
        copy();
        c.height = this.value; 
        paste();
      }
    };


    $('input.control').change(function(){ 
      handlers[$(this).data('handle')].apply(this);
    });  



  })(editor);




})();



