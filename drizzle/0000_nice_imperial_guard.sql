CREATE SEQUENCE chat_log_id_seq START 0 MINVALUE 0;

ALTER TABLE chat_log 
	ALTER COLUMN id SET DEFAULT nextval('chat_log_id_seq');