CREATE TABLE `user` (
    `id` varchar(50) NOT NULL,
    `password` varchar (70),
    `name` varchar (10) NOT NULL ,
    `phone_number`varchar (20) NOT NULL ,
    `sns_type` varchar (10),
    `host_true` boolean NOT NULL DEFAULT false ,
    PRIMARY KEY(`id`)
);