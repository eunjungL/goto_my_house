CREATE TABLE sms_validation (
    `phone_number`varchar (20) NOT NULL,
    `validation_code` varchar (10) NOT NULL ,
    `expire` DATETIME NOT NULL,
    PRIMARY KEY (`phone_number`)
);