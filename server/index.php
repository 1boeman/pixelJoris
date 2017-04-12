<?php 
session_start();

function set( $name, $value ){
  $_SESSION[$name] = $value; 
}


if (isset($_REQUEST['set']) ){
  $settings = array('width','height','tool','color','gridWidth');
  foreach($_REQUEST as $name => $value){
    if (in_array($name, $settings)) {
      set($name, $value);
    }
  }
}

header('Content-Type: application/json');
echo json_encode($_SESSION,JSON_FORCE_OBJECT);

