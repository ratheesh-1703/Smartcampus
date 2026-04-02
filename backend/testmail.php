<?php
$to = "yourgmail@gmail.com";
$subject = "Test Mail Working";
$message = "SmartCampus Email Test Successful!";
$headers = "From: smartcampus@gmail.com";

if(mail($to,$subject,$message,$headers)){
    echo "Mail Sent Successfully";
} else {
    echo "Mail Failed";
}
?>
