<?php

require 'SMTP.php';
$config = [

    // Debug mode will echo connection status alerts to
    // the screen throughout the email sending process.
    // Very helpful when testing your credentials.

    'debug_mode' => true,

    // Define the different connections that can be used.
    // You can set which connection to use when you create
    // the SMTP object: ``$mail = new SMTP('my_connection')``.

    'default' => 'primary',
    'connections' => [
        'primary' => [
            'host' => getenv('host'),
            'port' => getenv('port'),
            'secure' => 'tls', // null, 'ssl', or 'tls'
            'auth' => true, // true if authorization required
            'user' => getenv('email'),
            'pass' => getenv('password'),
        ],
    ],

    // NERD ONLY VARIABLE: You may want to change the origin
    // of the HELO request, as having the default value of
    // "localhost" may cause the email to be considered spam.
    // http://stackoverflow.com/questions/5294478/significance-of-localhost-in-helo-localhost

    'localhost' => 'https://www.outlook.com', // rename to the URL you want as origin of email

];
echo getenv('email');
use PHPlib\SMTP;
echo getenv('email');
$mail = new SMTP($config);
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
