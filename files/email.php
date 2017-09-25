<?php
$request = '';
if (!function_exists('ex'))
{
    function ex($object, $coords, $default = null)
    {
        if (!is_array($object) and !is_object($object))
        {
            return $default;
        }

        $keys = explode('.', $coords);
        foreach ($keys as $key)
        {
            if (is_array($object))
            {
                if (isset($object[$key]))
                {
                    $object = $object[$key];
                }
                else
                {
                    return $default;
                }
            }
            elseif (is_object($object))
            {
                if (isset($object->$key))
                {
                    $object = $object->$key;
                }
                else
                {
                    return $default;
                }
            }
            else
            {
                return $default;
            }
        }
        return $object ? $object : $default;
    }
}
$config = [

    // Debug mode will echo connection status alerts to
    // the screen throughout the email sending process.
    // Very helpful when testing your credentials.

    'debug_mode' => false,

    // Define the different connections that can be used.
    // You can set which connection to use when you create
    // the SMTP object: ``$mail = new SMTP('my_connection')``.

    'default' => 'primary',
    'connections' => [
        'primary' => [
            'host' => $_POST['host'],
            'port' => $_POST['port'],
            'secure' => $_POST['secure'], // null, 'ssl', or 'tls'
            'auth' => true, // true if authorization required
            'user' => $_POST['user'],
            'pass' => $_POST['password'],
        ],
    ],

    // NERD ONLY VARIABLE: You may want to change the origin
    // of the HELO request, as having the default value of
    // "localhost" may cause the email to be considered spam.
    // http://stackoverflow.com/questions/5294478/significance-of-localhost-in-helo-localhost

    'localhost' => $_POST['url'], // rename to the URL you want as origin of email
];

require('SMTP.php');
use PHPlib\SMTP;
$mail = new SMTP($config);
$mail->to($_POST['to']);
$mail->from($_POST['email'], $_POST['from']); // email is required, name is optional
$mail->subject($_POST['subject']);
$mail->body($_POST['body']);
$result = $mail->send();
echo json_encode( $result ) ?>
