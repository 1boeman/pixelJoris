<?php 
session_start();

function set( $name, $value ){
  $_SESSION[$name] = $value; 
}


if (isset($_REQUEST['set']) ){
  $settings = array('width','height','tool');
  foreach($_REQUEST as $name => $value){
    if (in_array($name, $settings)) {
      set($name, $value);
    }
  }
}

echo json_encode($_SESSION);

