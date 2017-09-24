<?php
require 'PHPMailerAutoload.php';
$mail = new PHPMailer();
$mail->IsSMTP(); // telling the class to use SMTP
$mail->Host       = "smtp-mail.outlook.com"; // SMTP server
$mail->SMTPDebug  = 2;                     // enables SMTP debug information (for testing)
// 1 = errors and messages
// 2 = messages only
$mail->SMTPAuth   = true;                  // enable SMTP authentication
$mail->SMTPSecure = "tls";                 // sets the prefix to the server
$mail->Host       = "smtp-mail.outlook.com";      // sets Outlook as the SMTP server
$mail->Port       = 587;                   // set the SMTP port for the GMAIL server
$mail->Username   = "ftek-streckning@outlook.com";  // GMAIL username
$mail->Password   = ".mRM~!m,";            // GMAIL password

$mail->setFrom('ftek-streckning@outlook.com', 'Streckmail Boten');
$mail->addAddress('johan.winther@outlook.com', 'Johan Winther');
$mail->Subject  = 'Streckmail';
$mail->Body     = 'Hi! This is my first e-mail sent through PHPMailer.';

if(!$mail->send()) {
  echo 'Message was not sent.';
  echo 'Mailer error: ' . $mail->ErrorInfo;
} else {
  echo 'Message has been sent.';
}
?>
