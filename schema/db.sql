CREATE TABLE IF NOT EXISTS eventTable (
  eventID BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  userID VARCHAR(255) NOT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  eventType VARCHAR(64) NOT NULL,
  PRIMARY KEY (eventID),
  KEY idx_event_type_ts (eventType, `timestamp`),
  KEY idx_event_ts (`timestamp`),
  KEY idx_event_user (userID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  expires INT UNSIGNED NOT NULL,
  data LONGTEXT,
  PRIMARY KEY (session_id),
  KEY idx_sessions_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;