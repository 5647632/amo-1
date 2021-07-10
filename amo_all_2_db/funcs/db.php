<?php

class DB
{
  private static $instances = [];

  private $pdo;

  protected function __construct() { }

  protected function __clone() { }

  public function __wakeup()
  {
    throw new \Exception("Cannot unserialize singleton");
  }

  public static function getInstance()
  {
    $subclass = static::class;
    if (!isset(self::$instances[$subclass])) {
      self::$instances[$subclass] = new static();
    }
    return self::$instances[$subclass];
  }

  public function connect($host, $user, $password, $database)
  {
    $dsn = "mysql:host=" . $host . ";dbname=" . $database . ";charset=utf8";
    $this->pdo = new \PDO($dsn, $user, $password);  
  }

  public static function doConnect($host, $user, $password, $database)
  {
    $db = static::getInstance();
    $db->connect($host, $user, $password, $database);
  }

  public static function getPdo()
  {
    $db = static::getInstance();
    return $db->pdo;
  }

  public static function closeConnection()
  {
    $db = static::getInstance();
    $db->pdo = null;
  }
}
