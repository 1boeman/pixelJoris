(function(){

  var c = document.getElementById("hetCanvas");
  var ctx = c.getContext('2d')
  var editor = (function(ctx){
    

     

    var pub = {
      resize:function(w,h){
            

      }
    }    
    return pub; 
  })(ctx);

  

  var controls = (function(editor){
    var handlers = {
      setWidth : function(){
        c.width = this.value   
      },

      setHeight : function(){
        c.height = this.value; 
      }
    };


    $('input.control').change(function(){
      handlers[$(this).data('handle')].apply(this);
    });  



  })(editor);




















})();



