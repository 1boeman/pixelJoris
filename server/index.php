<?php 
session_start();
header('Content-Type: application/json');

define ('GALLERY', dirname(__FILE__).'/../gallery');

if (!is_dir(GALLERY)) {
  exit(GALLERY .' is not a directory');
} elseif (!is_readable(GALLERY)) {
  exit(GALLERY.' cannot be read');
} elseif (!is_writable(GALLERY)) {
  exit(GALLERY .' cannot be written to');
}


function copyImage( $filePath, $savePath ){

  $colorRgb = array('red' => 0, 'green' => 0, 'blue' => 0);  //background color

  $img = @imagecreatefrompng($filePath);
  $width  = imagesx($img);
  $height = imagesy($img);

  //create new image and fill with background color
  $backgroundImg = @imagecreatetruecolor($width, $height);
  $color = imagecolorallocate($backgroundImg, $colorRgb['red'], $colorRgb['green'], $colorRgb['blue']);
  imagefill($backgroundImg, 0, 0, $color);

  //copy original image to background
  imagecopy($backgroundImg, $img, 0, 0, 0, 0, $width, $height);

  //save as png
  imagepng($backgroundImg, $savePath, 0);

}

function generate_uuid() {
  return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
    mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
    mt_rand( 0, 0xffff ),
    mt_rand( 0, 0x0C2f ) | 0x4000,
    mt_rand( 0, 0x3fff ) | 0x8000,
    mt_rand( 0, 0x2Aff ), mt_rand( 0, 0xffD3 ), mt_rand( 0, 0xff4B )
  );
}


function set( $name, $value ){
  $_SESSION[$name] = $value; 
}

function gallery(){
  $subdirs = scandir(GALLERY,SCANDIR_SORT_DESCENDING);
  
  $rv = array();
  foreach($subdirs as $dir){
    if (substr($dir,0,2) == '20'){
      $rv[$dir]=array();
      $current_subdir_contents = scandir(GALLERY.'/'.$dir);
      foreach($current_subdir_contents as $file_name){
        if (substr($file_name,0,1) != '.'){
          list($width, $height, $type, $attr) = getimagesize(GALLERY.'/'.$dir.'/'.$file_name); 
          $rv[$dir][]= array(
            'file_name' => $file_name,
            'width' => $width,
            'height' => $height,
            'type' => $type,
            'attr' => $attr,
          );
        }
      }
    }    
  }

  if (empty($rv)){
    return new stdClass();
  }

  return $rv; 
}


if (isset($_REQUEST['gallery'])){
  $gallery = gallery(); 
  echo json_encode($gallery);
  exit;
}

if (isset($_REQUEST['set']) ){
  $settings = array('width','height','tool','color','gridWidth');
  foreach($_REQUEST as $name => $value){
    if (in_array($name, $settings)) {
      set($name, $value);
    }
  }
}

if (isset($_REQUEST['del'])){
  $img = $_REQUEST['del'];
  $img = explode('/',$img);
  $dir = dirname(__FILE__);
  $dir_parent  = implode('/',array($dir,'..','gallery',$img[2]));
  $result = array(); 
  $path = implode('/',array($dir,'..','gallery',$img[2],$img[3]));
  
  if(finfo_file(finfo_open(FILEINFO_MIME_TYPE),$path) == 'image/png'){
    unlink($path);
    $result[]= $img[3]; 
    $files = glob($dir_parent . "/*");
    if (empty($files)){
      rmdir($dir_parent); 
      $result[]= $img[2]; 
    } 
  }
  echo json_encode($result); 
  exit;
}

if (isset($_REQUEST['optimize'])){
  if (isset($_SESSION['fileName'])){
    $currentDir = getCurrentDir(); 
    $filePath = $currentDir .'/'.escapeshellcmd( $_SESSION['fileName'] );
    $optimised_filePath =  str_replace('.png','_optimised.png', $filePath );
    $optimus =  "pngcrush -reduce $filePath ".$optimised_filePath; 
    $resp = shell_exec( $optimus ); 
    if (file_exists($optimised_filePath)) {
      unlink($filePath); 
    }else{
      $_SESSION['flash_message'] = 'Done, but png_crush failed'; 
    }
  }
}

function getCurrentDir(){
  $path = GALLERY;
  $dateDir = date("Y-m-d");
  if (!is_writable($path)) throw new Exception($path .' is not writable.');
  return $path.'/'.$dateDir;
}


if (isset($_REQUEST['save'])){
  if (isset($_REQUEST['dataUrl'])) {
    try {
      $img = $_REQUEST['dataUrl']; 
      $img = str_replace('data:image/png;base64,', '', $img);
      $img = str_replace(' ', '+', $img);
      $fileData = base64_decode($img);
      $tmp_dir = generate_uuid(); 
      $tmpPath = '/tmp/'.$tmp_dir;
      $dirPath = getCurrentDir(); 
      mkdir($tmpPath);
      $fileName = uniqid('image_',true).'.png';
      $tmpFilePath = $tmpPath.'/'.$fileName;
      $filePath = $dirPath .'/'. $fileName;
      mkdir (dirname($filePath));
      file_put_contents($tmpFilePath, $fileData);
      copyImage($tmpFilePath,$filePath);

      $_SESSION['fileName'] = $fileName; 
      unlink ($tmpFilePath);
      rmdir($tmpPath);

    } catch (Exception $e) {
      //      echo 'Caught exception: ',  $e->getMessage(), "\n";
      echo json_encode(array('Error'=>'Something went wrong'), JSON_FORCE_OBJECT);
      exit;
    }
  } 
}

echo json_encode($_SESSION,JSON_FORCE_OBJECT);
if (isset($_SESSION['flash_message'])) unset($_SESSION['flash_message']);
