<?php
echo getenv('email');
use PHPlib\SMTP;
echo getenv('email');
$mail = new SMTP(require __DIR__ . '/files/email-config.php');
echo getenv('email');
$mail->to('welocy95@gmail.com');
echo getenv('email');
$mail->from(getenv('email'), 'Ebba Ekblom'); // email is required, name is optional
echo getenv('email');
$mail->reply('ekebba@student.chalmers.se', 'Ebba Ekblom');
echo getenv('email');
$mail->subject('Streckskuld');
echo getenv('email');
$mail->body('This is a <b>HTML</b> email.');
echo getenv('email');
$result = $mail->send();
echo $result; ?>
