<?php
use PHPlib\SMTP;
$mail = new SMTP(require __DIR__ . 'email-config.php');
$mail->to('welocy95@gmail.com');
$mail->from(getenv('email'), 'Ebba Ekblom'); // email is required, name is optional
$mail->reply('ekebba@student.chalmers.se', 'Ebba Ekblom');
$mail->subject('Streckskuld');
$mail->body('This is a <b>HTML</b> email.');
$result = $mail->send();
 ?>
