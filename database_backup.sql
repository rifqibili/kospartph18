-- MySQL dump 10.13  Distrib 8.0.30, for Win64 (x86_64)
--
-- Host: localhost    Database: kospart_ph_18
-- ------------------------------------------------------
-- Server version	8.0.30

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bookings`
--

DROP TABLE IF EXISTS `bookings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bookings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `booking_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `tenant_id` bigint unsigned NOT NULL,
  `rental_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `price_monthly` decimal(12,2) NOT NULL,
  `price_yearly` decimal(12,2) NOT NULL DEFAULT '0.00',
  `price_weekend` decimal(12,2) NOT NULL DEFAULT '0.00',
  `price_daily` decimal(12,2) NOT NULL,
  `price_weekly` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(12,2) NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `payment_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid',
  `paid_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unverified_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `unverified_proof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_proof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `invoice_items` json DEFAULT NULL,
  `otp_code` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `otp_verified` tinyint(1) NOT NULL DEFAULT '0',
  `otp_sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `bookings_booking_code_unique` (`booking_code`),
  KEY `bookings_room_id_foreign` (`room_id`),
  KEY `bookings_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `bookings_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bookings_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bookings`
--

LOCK TABLES `bookings` WRITE;
/*!40000 ALTER TABLE `bookings` DISABLE KEYS */;
INSERT INTO `bookings` VALUES (21,'BOOK-5AVLXVFG',2,2,'monthly','2026-04-14','2026-07-14',1700000.00,0.00,0.00,0.00,0.00,5100000.00,'active','paid',5100000.00,0.00,NULL,'payments/AHrpBshCZZ3ajlabuDXaYVnaZ3D7cjD5w4wKjTy3.png','[{\"end\": \"2026-05-14T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1700000, \"start\": \"2026-04-14T00:00:00.000Z\"}, {\"end\": \"2026-06-14T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1700000, \"start\": \"2026-05-14T00:00:00.000Z\"}, {\"end\": \"2026-07-14T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1700000, \"start\": \"2026-06-14T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(22,'BOOK-TIYKZN9S',3,3,'monthly','2026-02-17','2026-07-17',1800000.00,0.00,0.00,0.00,0.00,9000000.00,'active','dp',6400000.00,0.00,NULL,'payments/JxVISUhyeqJWqHwWC8QQA5wktLfz3S5qAqMehXvY.png','[{\"end\": \"2026-03-17T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-02-17T00:00:00.000Z\"}, {\"end\": \"2026-04-17T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-03-17T00:00:00.000Z\"}, {\"end\": \"2026-05-17T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-04-17T00:00:00.000Z\"}, {\"end\": \"2026-06-17T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-05-17T00:00:00.000Z\"}, {\"end\": \"2026-07-17T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-06-17T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(24,'BOOK-XYB8CIY7',5,5,'monthly','2026-06-07','2026-07-07',1800000.00,0.00,0.00,0.00,0.00,1800000.00,'active','paid',1800000.00,0.00,NULL,NULL,'[{\"end\": \"2026-07-07T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-06-07T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(25,'BOOK-R7EGWABO',6,6,'monthly','2026-01-21','2026-07-21',1800000.00,0.00,0.00,0.00,0.00,10800000.00,'active','paid',10800000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-21T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-01-21T00:00:00.000Z\"}, {\"end\": \"2026-03-21T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-02-21T00:00:00.000Z\"}, {\"end\": \"2026-04-21T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-03-21T00:00:00.000Z\"}, {\"end\": \"2026-05-21T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-04-21T00:00:00.000Z\"}, {\"end\": \"2026-06-21T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-05-21T00:00:00.000Z\"}, {\"end\": \"2026-07-21T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1800000, \"start\": \"2026-06-21T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(26,'BOOK-POXOETHV',7,7,'monthly','2026-02-03','2026-07-03',2500000.00,0.00,0.00,0.00,0.00,12500000.00,'active','paid',12500000.00,0.00,NULL,NULL,'[{\"end\": \"2026-03-03T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 2500000, \"start\": \"2026-02-03T00:00:00.000Z\"}, {\"end\": \"2026-04-03T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 2500000, \"start\": \"2026-03-03T00:00:00.000Z\"}, {\"end\": \"2026-05-03T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 2500000, \"start\": \"2026-04-03T00:00:00.000Z\"}, {\"end\": \"2026-06-03T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 2500000, \"start\": \"2026-05-03T00:00:00.000Z\"}, {\"end\": \"2026-07-03T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 2500000, \"start\": \"2026-06-03T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(27,'BOOK-RQK7AEKH',8,8,'monthly','2026-02-02','2026-07-02',1500000.00,0.00,0.00,0.00,0.00,7500000.00,'active','paid',7500000.00,0.00,NULL,NULL,'[{\"end\": \"2026-03-02T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1500000, \"start\": \"2026-02-02T00:00:00.000Z\"}, {\"end\": \"2026-04-02T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1500000, \"start\": \"2026-03-02T00:00:00.000Z\"}, {\"end\": \"2026-05-02T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1500000, \"start\": \"2026-04-02T00:00:00.000Z\"}, {\"end\": \"2026-06-02T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1500000, \"start\": \"2026-05-02T00:00:00.000Z\"}, {\"end\": \"2026-07-02T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1500000, \"start\": \"2026-06-02T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(28,'BOOK-FLSL5M35',9,9,'monthly','2026-06-13','2026-07-13',1800000.00,0.00,0.00,0.00,0.00,1800000.00,'active','paid',1800000.00,0.00,NULL,NULL,'[{\"end\": \"2026-07-13T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-06-13T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(29,'BOOK-4JNXUS1B',10,10,'monthly','2026-01-31','2026-07-31',1650000.00,0.00,0.00,0.00,0.00,9900000.00,'active','paid',9900000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-28T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1650000, \"start\": \"2026-01-31T00:00:00.000Z\"}, {\"end\": \"2026-03-31T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1650000, \"start\": \"2026-02-28T00:00:00.000Z\"}, {\"end\": \"2026-04-30T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1650000, \"start\": \"2026-03-31T00:00:00.000Z\"}, {\"end\": \"2026-05-31T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1650000, \"start\": \"2026-04-30T00:00:00.000Z\"}, {\"end\": \"2026-06-30T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1650000, \"start\": \"2026-05-31T00:00:00.000Z\"}, {\"end\": \"2026-07-31T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1650000, \"start\": \"2026-06-30T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 01:18:28'),(30,'BOOK-UBYPBQKK',11,11,'monthly','2026-01-25','2026-07-25',1500000.00,0.00,0.00,0.00,0.00,9000000.00,'active','paid',9000000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-25T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1500000, \"start\": \"2026-01-25T00:00:00.000Z\"}, {\"end\": \"2026-03-25T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1500000, \"start\": \"2026-02-25T00:00:00.000Z\"}, {\"end\": \"2026-04-25T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1500000, \"start\": \"2026-03-25T00:00:00.000Z\"}, {\"end\": \"2026-05-25T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1500000, \"start\": \"2026-04-25T00:00:00.000Z\"}, {\"end\": \"2026-06-25T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1500000, \"start\": \"2026-05-25T00:00:00.000Z\"}, {\"end\": \"2026-07-25T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1500000, \"start\": \"2026-06-25T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(31,'BOOK-KXMPMFGF',12,12,'monthly','2026-02-01','2026-07-01',1650000.00,0.00,0.00,0.00,0.00,8250000.00,'active','paid',8250000.00,0.00,NULL,NULL,'[{\"end\": \"2026-03-01T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1650000, \"start\": \"2026-02-01T00:00:00.000Z\"}, {\"end\": \"2026-04-01T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1650000, \"start\": \"2026-03-01T00:00:00.000Z\"}, {\"end\": \"2026-05-01T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1650000, \"start\": \"2026-04-01T00:00:00.000Z\"}, {\"end\": \"2026-06-01T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1650000, \"start\": \"2026-05-01T00:00:00.000Z\"}, {\"end\": \"2026-07-01T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1650000, \"start\": \"2026-06-01T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(32,'BOOK-TNZCNQZ5',13,13,'monthly','2026-06-04','2026-07-04',1800000.00,0.00,0.00,0.00,0.00,1800000.00,'active','paid',1800000.00,0.00,NULL,NULL,'[{\"end\": \"2026-07-04T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-06-04T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(33,'BOOK-AZVDD9ZV',14,14,'monthly','2026-01-30','2026-07-30',1850000.00,0.00,0.00,0.00,0.00,11100000.00,'active','paid',11100000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-28T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1850000, \"start\": \"2026-01-30T00:00:00.000Z\"}, {\"end\": \"2026-03-30T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1850000, \"start\": \"2026-02-28T00:00:00.000Z\"}, {\"end\": \"2026-04-30T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1850000, \"start\": \"2026-03-30T00:00:00.000Z\"}, {\"end\": \"2026-05-30T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1850000, \"start\": \"2026-04-30T00:00:00.000Z\"}, {\"end\": \"2026-06-30T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1850000, \"start\": \"2026-05-30T00:00:00.000Z\"}, {\"end\": \"2026-07-30T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1850000, \"start\": \"2026-06-30T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(34,'BOOK-ANBAGU3W',15,15,'monthly','2026-01-25','2026-07-25',1800000.00,0.00,0.00,0.00,0.00,10800000.00,'active','paid',10800000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-25T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-01-25T00:00:00.000Z\"}, {\"end\": \"2026-03-25T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-02-25T00:00:00.000Z\"}, {\"end\": \"2026-04-25T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-03-25T00:00:00.000Z\"}, {\"end\": \"2026-05-25T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-04-25T00:00:00.000Z\"}, {\"end\": \"2026-06-25T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-05-25T00:00:00.000Z\"}, {\"end\": \"2026-07-25T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1800000, \"start\": \"2026-06-25T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(35,'BOOK-Y7OWJQRW',16,16,'monthly','2026-02-01','2026-07-01',1800000.00,0.00,0.00,0.00,0.00,9000000.00,'active','paid',9000000.00,0.00,NULL,NULL,'[{\"end\": \"2026-03-01T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-02-01T00:00:00.000Z\"}, {\"end\": \"2026-04-01T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-03-01T00:00:00.000Z\"}, {\"end\": \"2026-05-01T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-04-01T00:00:00.000Z\"}, {\"end\": \"2026-06-01T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-05-01T00:00:00.000Z\"}, {\"end\": \"2026-07-01T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-06-01T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(36,'BOOK-C9CRTUZ8',17,17,'monthly','2026-03-15','2026-08-15',1800000.00,0.00,0.00,0.00,0.00,9000000.00,'active','paid',9000000.00,0.00,NULL,NULL,'[{\"end\": \"2026-04-15T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-03-15T00:00:00.000Z\"}, {\"end\": \"2026-05-15T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-04-15T00:00:00.000Z\"}, {\"end\": \"2026-06-15T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-05-15T00:00:00.000Z\"}, {\"end\": \"2026-07-15T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-06-15T00:00:00.000Z\"}, {\"end\": \"2026-08-15T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-07-15T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(37,'BOOK-BXM1WT6M',18,18,'monthly','2026-04-06','2026-07-06',1800000.00,0.00,0.00,0.00,0.00,5400000.00,'active','paid',5400000.00,0.00,NULL,NULL,'[{\"end\": \"2026-05-06T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-04-06T00:00:00.000Z\"}, {\"end\": \"2026-06-06T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-05-06T00:00:00.000Z\"}, {\"end\": \"2026-07-06T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-06-06T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(38,'BOOK-I1GBPQ4H',19,19,'monthly','2026-05-03','2026-07-03',1800000.00,0.00,0.00,0.00,0.00,3600000.00,'active','paid',3600000.00,0.00,NULL,NULL,'[{\"end\": \"2026-06-03T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-05-03T00:00:00.000Z\"}, {\"end\": \"2026-07-03T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-06-03T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(39,'BOOK-A96X7S91',20,20,'monthly','2026-02-18','2026-07-18',1800000.00,0.00,0.00,0.00,0.00,9000000.00,'active','paid',9000000.00,0.00,NULL,'payments/DC5v1KQ07lqRfQeQA6GgiMHQGrgQVVEbPAp7ibfY.jpg','[{\"end\": \"2026-03-18T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1800000, \"start\": \"2026-02-18T00:00:00.000Z\"}, {\"end\": \"2026-04-18T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1800000, \"start\": \"2026-03-18T00:00:00.000Z\"}, {\"end\": \"2026-05-18T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1800000, \"start\": \"2026-04-18T00:00:00.000Z\"}, {\"end\": \"2026-06-18T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1800000, \"start\": \"2026-05-18T00:00:00.000Z\"}, {\"end\": \"2026-07-18T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1800000, \"start\": \"2026-06-18T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(40,'BOOK-B5R3PICL',21,21,'monthly','2026-01-26','2026-07-26',1650000.00,0.00,0.00,0.00,0.00,9900000.00,'active','paid',9900000.00,0.00,NULL,NULL,'[{\"end\": \"2026-02-26T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1650000, \"start\": \"2026-01-26T00:00:00.000Z\"}, {\"end\": \"2026-03-26T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1650000, \"start\": \"2026-02-26T00:00:00.000Z\"}, {\"end\": \"2026-04-26T00:00:00.000Z\", \"label\": \"Bulan ke-3\", \"price\": 1650000, \"start\": \"2026-03-26T00:00:00.000Z\"}, {\"end\": \"2026-05-26T00:00:00.000Z\", \"label\": \"Bulan ke-4\", \"price\": 1650000, \"start\": \"2026-04-26T00:00:00.000Z\"}, {\"end\": \"2026-06-26T00:00:00.000Z\", \"label\": \"Bulan ke-5\", \"price\": 1650000, \"start\": \"2026-05-26T00:00:00.000Z\"}, {\"end\": \"2026-07-26T00:00:00.000Z\", \"label\": \"Bulan ke-6\", \"price\": 1650000, \"start\": \"2026-06-26T00:00:00.000Z\"}]',NULL,1,NULL,'2026-06-10 21:44:41','2026-06-29 00:37:21'),(41,'KP-6A2A5F8DBDF1A',22,22,'daily','2026-06-11','2026-06-12',1200000.00,0.00,0.00,200000.00,0.00,200000.00,'completed','paid',200000.00,0.00,NULL,'/storage/payment_proofs/284qevLvRxiakB2PfG28fEVFbYMB3QQ8MWFbrcFX.jpg','[{\"end\": \"2026-06-12T00:00:00.000Z\", \"label\": \"Hari ke-1\", \"price\": 200000, \"start\": \"2026-06-11T00:00:00.000Z\"}]','874846',1,'2026-06-11 00:11:09','2026-06-11 00:11:09','2026-06-29 00:37:21'),(42,'KP-M-6A2CB71DC4AF1',4,22,'daily','2026-06-13','2026-06-20',1800000.00,0.00,0.00,200000.00,0.00,1400000.00,'completed','paid',1400000.00,0.00,NULL,NULL,'[{\"end\": \"2026-06-14T00:00:00.000Z\", \"label\": \"Hari ke-1\", \"price\": 200000, \"start\": \"2026-06-13T00:00:00.000Z\"}, {\"end\": \"2026-06-15T00:00:00.000Z\", \"label\": \"Hari ke-2\", \"price\": 200000, \"start\": \"2026-06-14T00:00:00.000Z\"}, {\"end\": \"2026-06-16T00:00:00.000Z\", \"label\": \"Hari ke-3\", \"price\": 200000, \"start\": \"2026-06-15T00:00:00.000Z\"}, {\"end\": \"2026-06-17T00:00:00.000Z\", \"label\": \"Hari ke-4\", \"price\": 200000, \"start\": \"2026-06-16T00:00:00.000Z\"}, {\"end\": \"2026-06-18T00:00:00.000Z\", \"label\": \"Hari ke-5\", \"price\": 200000, \"start\": \"2026-06-17T00:00:00.000Z\"}, {\"end\": \"2026-06-19T00:00:00.000Z\", \"label\": \"Hari ke-6\", \"price\": 200000, \"start\": \"2026-06-18T00:00:00.000Z\"}, {\"end\": \"2026-06-20T00:00:00.000Z\", \"label\": \"Hari ke-7\", \"price\": 200000, \"start\": \"2026-06-19T00:00:00.000Z\"}]','000000',1,'2026-06-12 18:49:17','2026-06-12 18:49:17','2026-06-29 00:37:21'),(43,'KP-6A2D071A454BA',22,22,'weekly','2026-06-13','2026-06-20',1200000.00,0.00,0.00,200000.00,0.00,0.00,'completed','paid',0.00,0.00,NULL,'payments/v0rfyJNXxd2f3jTTxrfsxbS3a7DI3dqeo0J1SDvr.png','[{\"end\": \"2026-06-20T00:00:00.000Z\", \"label\": \"Minggu ke-1\", \"price\": 0, \"start\": \"2026-06-13T00:00:00.000Z\"}]','525956',1,'2026-06-13 00:30:34','2026-06-13 00:30:34','2026-06-29 00:37:21'),(45,'KP-M-6A2E90B789785',22,26,'weekly','2026-06-14','2026-06-21',1200000.00,0.00,0.00,200000.00,0.00,0.00,'completed','paid',0.00,0.00,NULL,NULL,'[{\"end\": \"2026-06-21T00:00:00.000Z\", \"label\": \"Minggu ke-1\", \"price\": 0, \"start\": \"2026-06-14T00:00:00.000Z\"}]','000000',1,'2026-06-14 04:29:59','2026-06-14 04:29:59','2026-06-29 00:37:21'),(46,'KP-M-6A2E919698042',4,26,'weekly','2026-06-14','2026-06-30',1800000.00,0.00,0.00,200000.00,0.00,2400000.00,'active','paid',2400000.00,0.00,NULL,NULL,'[{\"end\": \"2026-06-21T00:00:00.000Z\", \"label\": \"Minggu ke-1\", \"price\": 960000, \"start\": \"2026-06-14T00:00:00.000Z\"}, {\"end\": \"2026-06-28T00:00:00.000Z\", \"label\": \"Minggu ke-2\", \"price\": 960000, \"start\": \"2026-06-21T00:00:00.000Z\"}, {\"end\": \"2026-06-29T00:00:00.000Z\", \"label\": \"Hari ke-1 (Tambahan)\", \"price\": 240000, \"start\": \"2026-06-28T00:00:00.000Z\"}, {\"end\": \"2026-06-30T00:00:00.000Z\", \"label\": \"Hari ke-2 (Tambahan)\", \"price\": 240000, \"start\": \"2026-06-29T00:00:00.000Z\"}]','000000',1,'2026-06-14 04:33:42','2026-06-14 04:33:42','2026-06-29 00:37:21'),(49,'KP-6A3B794D1C538',22,28,'monthly','2026-06-24','2026-08-24',1200000.00,12000000.00,250000.00,200000.00,800000.00,2400000.00,'active','paid',2400000.00,0.00,NULL,'payments/vvfuXsxGMeZJ2bxBK64iibc70tASVgZ4JHzFrejP.jpg','[{\"end\": \"2026-07-24T00:00:00.000Z\", \"label\": \"Bulan ke-1\", \"price\": 1200000, \"start\": \"2026-06-24T00:00:00.000Z\"}, {\"end\": \"2026-08-24T00:00:00.000Z\", \"label\": \"Bulan ke-2\", \"price\": 1200000, \"start\": \"2026-07-24T00:00:00.000Z\"}]','467504',1,'2026-06-23 23:29:33','2026-06-23 23:29:33','2026-06-29 00:37:21');
/*!40000 ALTER TABLE `bookings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `maps_link` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `image_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `video_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,'Kospart PH 18 - Utama','Samping BNI kartini dikomplek perukoan dibelakang mall kartini masuk jalannya dari samping halte kartini) H7M3+J6F, Palapa, Pusat, Kec. Tj. Karang Pusat, Kota Bandar Lampung, Lampung 35118','https://www.google.com/maps/place/kospart+PH+18/@-5.4161417,105.2509998,17z/data=!3m1!4b1!4m19!1m9!4m8!1m0!1m6!1m2!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!2skospart+PH+18,+samping+BNI+kartini+dikomplek+perukoan+dibelakang+mall+kartini+masuk+jalannya+dari+samping+halte+kartini)+H7M3%2BJ6F,+Palapa,+Pusat,+Kec.+Tj.+Karang+Pusat,+Kota+Bandar+Lampung,+Lampung+35118!2m2!1d105.2535747!2d-5.416147!3m8!1s0x2e40dbb43262d9df:0xa1cf05d7be03bb72!5m2!4m1!1i2!8m2!3d-5.416147!4d105.2535747!16s%2Fg%2F11yspfw7t2?entry=ttu&g_ep=EgoyMDI2MDYwMy4xIKXMDSoASAFQAw%3D%3D','active','/storage/branch_images/oeeJh0bgZ1CsUP2m60HKJAgnusKJYo7ptB5a7Nxo.png',NULL,'2026-06-10 19:17:58','2026-06-23 01:58:10');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache`
--

DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache`
--

LOCK TABLES `cache` WRITE;
/*!40000 ALTER TABLE `cache` DISABLE KEYS */;
INSERT INTO `cache` VALUES ('kospart-ph-18-cache-dashboard_stats_resident_28','a:8:{s:10:\"totalRooms\";i:1;s:13:\"occupiedRooms\";i:1;s:14:\"availableRooms\";i:0;s:16:\"maintenanceRooms\";i:0;s:11:\"bookedRooms\";i:0;s:13:\"totalBranches\";i:1;s:17:\"pendingComplaints\";i:0;s:12:\"totalTenants\";i:0;}',1782447336),('kospart-ph-18-cache-dashboard_stats_super_admin_1','a:8:{s:10:\"totalRooms\";i:21;s:13:\"occupiedRooms\";i:21;s:14:\"availableRooms\";i:0;s:16:\"maintenanceRooms\";i:0;s:11:\"bookedRooms\";i:0;s:13:\"totalBranches\";i:1;s:17:\"pendingComplaints\";i:0;s:12:\"totalTenants\";i:22;}',1782447337);
/*!40000 ALTER TABLE `cache` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cache_locks`
--

DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL,
  PRIMARY KEY (`key`),
  KEY `cache_locks_expiration_index` (`expiration`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cache_locks`
--

LOCK TABLES `cache_locks` WRITE;
/*!40000 ALTER TABLE `cache_locks` DISABLE KEYS */;
/*!40000 ALTER TABLE `cache_locks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_item_recipes`
--

DROP TABLE IF EXISTS `canteen_item_recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_item_recipes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `menu_item_id` bigint unsigned NOT NULL,
  `ingredient_item_id` bigint unsigned NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `canteen_item_recipes_menu_item_id_foreign` (`menu_item_id`),
  KEY `canteen_item_recipes_ingredient_item_id_foreign` (`ingredient_item_id`),
  CONSTRAINT `canteen_item_recipes_ingredient_item_id_foreign` FOREIGN KEY (`ingredient_item_id`) REFERENCES `canteen_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `canteen_item_recipes_menu_item_id_foreign` FOREIGN KEY (`menu_item_id`) REFERENCES `canteen_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_item_recipes`
--

LOCK TABLES `canteen_item_recipes` WRITE;
/*!40000 ALTER TABLE `canteen_item_recipes` DISABLE KEYS */;
INSERT INTO `canteen_item_recipes` VALUES (3,63,62,1.00,'2026-06-14 00:49:09','2026-06-14 00:49:09'),(4,63,51,1.00,'2026-06-14 00:49:09','2026-06-14 00:49:09'),(5,64,2,200.00,'2026-06-14 00:49:53','2026-06-14 00:49:53'),(6,64,52,3.99,'2026-06-14 00:49:53','2026-06-14 00:49:53'),(11,68,52,4.00,'2026-06-14 00:52:13','2026-06-14 00:52:13'),(13,70,62,1.00,'2026-06-14 00:53:13','2026-06-14 00:53:13'),(24,61,2,200.00,'2026-06-14 02:21:28','2026-06-14 02:21:28'),(25,61,51,1.00,'2026-06-14 02:21:28','2026-06-14 02:21:28'),(26,75,60,1.00,'2026-06-14 02:50:29','2026-06-14 02:50:29'),(27,73,60,1.00,'2026-06-14 02:51:19','2026-06-14 02:51:19'),(28,73,58,1.00,'2026-06-14 02:51:19','2026-06-14 02:51:19'),(29,71,58,1.00,'2026-06-14 02:52:10','2026-06-14 02:52:10'),(30,72,59,1.00,'2026-06-14 02:53:14','2026-06-14 02:53:14'),(31,74,58,1.00,'2026-06-14 02:53:51','2026-06-14 02:53:51'),(32,74,59,1.00,'2026-06-14 02:53:51','2026-06-14 02:53:51'),(33,76,60,1.00,'2026-06-14 18:57:22','2026-06-14 18:57:22'),(34,67,2,1.00,'2026-06-14 19:04:11','2026-06-14 19:04:11'),(35,66,65,1.00,'2026-06-15 02:16:34','2026-06-15 02:16:34'),(36,66,2,200.00,'2026-06-15 02:16:34','2026-06-15 02:16:34'),(42,69,51,1.00,'2026-06-15 18:38:35','2026-06-15 18:38:35'),(43,90,58,1.00,'2026-06-15 18:52:17','2026-06-15 18:52:17'),(47,85,84,1.00,'2026-06-23 02:43:35','2026-06-23 02:43:35'),(48,85,51,1.00,'2026-06-23 02:43:35','2026-06-23 02:43:35'),(49,89,2,200.00,'2026-06-23 02:47:55','2026-06-23 02:47:55'),(50,89,65,1.00,'2026-06-23 02:47:55','2026-06-23 02:47:55'),(51,89,51,1.00,'2026-06-23 02:47:55','2026-06-23 02:47:55'),(53,91,84,1.00,'2026-06-29 02:16:17','2026-06-29 02:16:17');
/*!40000 ALTER TABLE `canteen_item_recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_items`
--

DROP TABLE IF EXISTS `canteen_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(15,2) NOT NULL,
  `stock` int NOT NULL DEFAULT '0',
  `unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_sellable` tinyint(1) NOT NULL DEFAULT '1',
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `canteen_items_branch_id_foreign` (`branch_id`),
  CONSTRAINT `canteen_items_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=92 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_items`
--

LOCK TABLES `canteen_items` WRITE;
/*!40000 ALTER TABLE `canteen_items` DISABLE KEYS */;
INSERT INTO `canteen_items` VALUES (1,1,'Nasi Goreng','food',15000.00,8,NULL,1,'canteen_images/valIuiIwSZ6kUQtD96ehVylJJoMZ3975h2keocWd.jpg',NULL,'2026-06-11 02:10:43','2026-06-23 02:43:53'),(2,1,'Beras','ingredient',0.00,29599,'gram',0,NULL,NULL,'2026-06-11 02:11:14','2026-06-25 21:23:48'),(3,1,'Beng Beng','snack',5000.00,5,NULL,1,'canteen_images/9VPgExzFNBrD9l1iPlOC1awt1leJxwHZNNPtjJYj.jpg','Cemilan Coklat','2026-06-13 18:58:02','2026-06-15 02:03:19'),(4,1,'Superstar','snack',1000.00,24,NULL,1,'canteen_images/U76QpNZW7645QqLZB9cqzWmpbDis1OeJmiw9ngA4.jpg','Cemilan stick coklat','2026-06-13 18:59:24','2026-06-14 02:25:33'),(5,1,'Dilan C\'real','snack',2000.00,6,NULL,1,'canteen_images/JcF8s68vWKptWaU8rid1vJFHEAYWPY2bXB6NzuyV.jpg',NULL,'2026-06-13 19:00:11','2026-06-14 02:26:51'),(6,1,'Pop Mie Kari Ayam','food',10000.00,39,NULL,1,'canteen_images/ESwHlkDsCBhok1RaWLxUhgVVfWy7PwpGwDKFyOnr.jpg',NULL,'2026-06-13 19:04:59','2026-06-15 20:06:34'),(7,1,'Momogi Keju','snack',1000.00,28,NULL,1,'canteen_images/mbPriWclTfzanE9BTjxNuu0PDllH0rvJbdz1HCQ9.jpg',NULL,'2026-06-13 19:09:17','2026-06-14 02:33:28'),(8,1,'Momogi Coklat','snack',1000.00,28,NULL,1,'canteen_images/OqTsgg8AYB7Kd0UxC4IhvkqcpCsz9hhWmCTOBBER.jpg',NULL,'2026-06-13 19:10:10','2026-06-14 02:26:26'),(9,1,'Basreng','snack',1000.00,480,NULL,1,'canteen_images/FMHDp0AkoB7PvSMpqH8YyrVb06TsZmWXelxBZJzc.jpg',NULL,'2026-06-13 19:13:23','2026-06-19 21:00:16'),(10,1,'Sukro Oven','snack',2000.00,16,NULL,1,'canteen_images/fOQr40nQVB12pCyfZ3Q6tRkM1Nby3rxqfNUVAfgo.jpg',NULL,'2026-06-13 19:14:32','2026-06-14 02:32:48'),(11,1,'Sukro','snack',2000.00,322,NULL,1,'canteen_images/iITQ54LlpiwqltJM9KyCOPm87sRTkp3UFEl4wjgO.jpg',NULL,'2026-06-13 19:15:34','2026-06-14 02:33:06'),(12,1,'Tango coklat','snack',10000.00,24,NULL,1,'canteen_images/c8W5GnZZuiXdYiRoj0dMKROHnETXlfDOqEQ7Kx11.jpg',NULL,'2026-06-13 19:17:47','2026-06-14 02:32:26'),(13,1,'Tango vanilla','snack',10000.00,1,NULL,1,'canteen_images/D5zGPn5PFuBGNDCKutgmtzanXniKjrFhtw9HHUUt.jpg',NULL,'2026-06-13 19:20:30','2026-06-14 02:31:34'),(15,1,'Potabee','snack',5000.00,20,NULL,1,'canteen_images/irpbe3jhv34m7EA6wdVoE30cTjiTfwYgh6yiT0fM.jpg',NULL,'2026-06-13 19:23:31','2026-06-14 02:31:56'),(16,1,'Pocari Sweat','drink',10000.00,19,NULL,1,'canteen_images/kxrheFyEWjS8jnmRsjoJ3OgpluZYTAbcKp3PxkVd.jpg',NULL,'2026-06-13 19:25:42','2026-06-14 02:30:48'),(17,1,'Nipis Madu','drink',10000.00,12,NULL,1,'canteen_images/r6hJCFQlqOq1jggscAnkwSAH0r0V19GQWud5AvEw.jpg',NULL,'2026-06-13 19:26:55','2026-06-14 02:31:06'),(18,1,'Fruit Tea X-Treme','drink',10000.00,2,NULL,1,'canteen_images/7XQqnRadCa66U32lvDj05aY8l9i3krrQSjYidVvF.jpg',NULL,'2026-06-13 19:32:37','2026-06-18 01:55:11'),(19,1,'Teh Gelas 350ml','drink',10000.00,1,NULL,1,'canteen_images/qHQ0xWVKJXddl5TYuyc8NTdaYW7NXXrHciFZRHrk.jpg',NULL,'2026-06-13 19:35:18','2026-06-14 02:28:21'),(20,1,'Nescafe Coffee Cream','drink',10000.00,8,NULL,1,'canteen_images/G7sCY1ucdeUxySJ2Ma9boVJaloYk7k5pWhp8GiC1.jpg',NULL,'2026-06-13 19:40:59','2026-06-14 02:29:17'),(21,1,'Lasegar Twist','drink',10000.00,11,NULL,1,'canteen_images/2usrG1p7VQWqpolfG77iOsb6m6Mc8Bg8xV5kMSrC.jpg','Rasa Jeruk Lemon','2026-06-13 19:42:01','2026-06-18 01:55:21'),(22,1,'Cap Panda Sarang Burung','drink',10000.00,13,NULL,1,'canteen_images/BcUZMdLjlkfo79NnoCj7qGbpZaYlhgm5lLlMhiHy.jpg',NULL,'2026-06-13 19:43:38','2026-06-14 02:29:53'),(23,1,'You C1000','drink',10000.00,39,NULL,1,'canteen_images/18ENfZky4T03RzJtQD1OreYLiQRLFa9gfChgD5bH.jpg','Vitamin Orange','2026-06-13 19:44:13','2026-06-14 18:46:13'),(24,1,'Cap Panda Cincau Selasih','drink',10000.00,2,NULL,1,'canteen_images/iDUV9MwGHB2z91diuuai7OFbH5fKVmYdbpoVAnBx.jpg',NULL,'2026-06-13 19:45:51','2026-06-14 02:28:38'),(25,1,'Lasegar Leci','drink',10000.00,16,NULL,1,'canteen_images/MFCn9OcvFaTWmobUu5EiRQ6dtOGyJP9IL575mVw5.jpg',NULL,'2026-06-13 19:48:16','2026-06-14 19:00:29'),(26,1,'Waku Nanas','ice_cream',5000.00,14,NULL,1,'canteen_images/F0vNyCRfEa0abeAS09d1BvxHpJAksL5oAjI9FFE6.jpg',NULL,'2026-06-13 19:56:37','2026-06-14 19:14:36'),(27,1,'Waku Soda','ice_cream',5000.00,17,NULL,1,'canteen_images/LJM9kijEtVv75spMExrmtUQPgt9TBZwZ94GlcJjW.jpg',NULL,'2026-06-13 19:57:18','2026-06-14 19:20:49'),(28,1,'Waku Ice Jelly Mangga','ice_cream',5000.00,4,NULL,1,NULL,NULL,'2026-06-13 19:58:12','2026-06-15 20:20:13'),(29,1,'Waku Mango Loop','ice_cream',5000.00,26,NULL,1,'canteen_images/ocm0kcvYO0bWkW1wvXkPOdLXge7gMOsrz1M1vsen.jpg',NULL,'2026-06-13 19:58:53','2026-06-14 19:13:48'),(30,1,'Ale Ale Ice Jeruk','ice_cream',5000.00,19,NULL,1,'canteen_images/goe06FZ8yIfUPO7NdneF4zp9jbVJReAV6Ray8JGH.jpg',NULL,'2026-06-13 19:59:31','2026-06-14 19:18:26'),(31,1,'Waku Ice Loly Strawberry dan Guava','ice_cream',5000.00,11,NULL,1,'canteen_images/0vHlwmE5TWRhgPpEQWzJS0CAtUSMdpfeHryMrAjw.jpg',NULL,'2026-06-13 20:00:06','2026-06-14 19:16:54'),(32,1,'Waku Choco Bery Loop','ice_cream',5000.00,37,NULL,1,'canteen_images/cwKxxDgLujFQowl9IutIoqVHbga5fLtb6SpfqAqy.jpg',NULL,'2026-06-13 20:00:40','2026-06-14 19:10:03'),(33,1,'Waku Choco Loop','ice_cream',5000.00,32,NULL,1,'canteen_images/WgYA2bqIB6E0BclkbxjRT0cwMqIEz3DFqNTjfEoi.jpg',NULL,'2026-06-13 20:02:06','2026-06-14 19:11:05'),(34,1,'Waku Choco Dinosaur','ice_cream',5000.00,28,NULL,1,'canteen_images/HpL4JvmjPeesBV7Ukay23gu3Be2Vhanw2YI0hdO4.jpg',NULL,'2026-06-13 20:03:06','2026-06-14 19:10:37'),(35,1,'Yakoo Frost Bite','ice_cream',10000.00,18,NULL,1,'canteen_images/qKa3HOXKC2gWZKJPKLRQ4qR025vSc7RuPpP7cHAL.jpg',NULL,'2026-06-13 20:05:01','2026-06-14 19:21:16'),(36,1,'Waku Cotton Candy','ice_cream',5000.00,8,NULL,1,'canteen_images/7sZpkz8VmlI5mDXuZajdj71vRtKYcZhEP0VMFulZ.jpg',NULL,'2026-06-13 20:06:02','2026-06-16 00:42:39'),(37,1,'Frost Bite Jcone Rainbow','ice_cream',10000.00,18,NULL,1,'canteen_images/gC2GbOEwkRnLXt2WE8Vla6WzJjbNGrbdR7F8LVcq.jpg',NULL,'2026-06-13 20:06:42','2026-06-14 18:49:10'),(38,1,'Frost Bite Cookies Mochi','ice_cream',10000.00,19,NULL,1,'canteen_images/BjGOJaTqsODvkb3ix4EXVjXMqH7dPsalAelu6nqy.jpg',NULL,'2026-06-13 20:07:28','2026-06-14 03:16:05'),(39,1,'Frost Bite Mochi Chew Grape','ice_cream',10000.00,12,NULL,1,'canteen_images/8ToNFZQsurvuXAFqAS6clJjYDtv4DbcQf1Dz9JSL.jpg',NULL,'2026-06-13 20:08:26','2026-06-14 18:50:33'),(40,1,'Frost Bite Mochi Pandan Srikaya','ice_cream',10000.00,9,NULL,1,'canteen_images/N9mxbp5pyY7YxdpdVQ2Tm1pspKnQ4GEbEro2eRBs.jpg',NULL,'2026-06-13 20:09:10','2026-06-14 18:51:32'),(41,1,'Frost Bite Kopi Jelly','ice_cream',10000.00,18,NULL,1,'canteen_images/YC1DIzCC7l1s34x3gdD18WxJLq4fQo4u6x11VfNY.png',NULL,'2026-06-13 20:09:58','2026-06-14 18:49:54'),(42,1,'Frost Bite Jcone Cookies','ice_cream',10000.00,10,NULL,1,'canteen_images/L6iLBpWItZ7uBUYAzPP32uL19v9ZKEnqGqSmGQYO.jpg',NULL,'2026-06-13 20:10:27','2026-06-14 03:42:15'),(43,1,'Frost Bite Cookies Cream','ice_cream',10000.00,8,NULL,1,'canteen_images/tfveX9NkhGuTAVtcwu91DtvosQ8cDCvmDd4DVb5V.jpg',NULL,'2026-06-13 20:10:52','2026-06-15 02:01:03'),(44,1,'Frost Bite Crunchy Double Choco','ice_cream',10000.00,15,NULL,1,'canteen_images/RrguU4hqypPmlPRbZYDR7i1hrqCPnNElJFx3NdBK.jpg',NULL,'2026-06-13 20:11:23','2026-06-14 03:40:44'),(45,1,'Frost Bite Boba Milk','ice_cream',10000.00,8,NULL,1,'canteen_images/CTHJQoF8DUt21e3zVnnxTr1VR1DdRhG3SkDZNLk0.jpg',NULL,'2026-06-13 20:12:17','2026-06-14 02:54:54'),(46,1,'Haku Double Choco Monaka','ice_cream',10000.00,3,NULL,1,'canteen_images/nHlQhZ874hPgf4uaNZ46CKHaVFX8AqEbEH4zsJqu.jpg',NULL,'2026-06-13 20:12:48','2026-06-14 18:56:22'),(47,1,'Haku Strawberry Vanilla','ice_cream',10000.00,5,NULL,1,'canteen_images/EAWXmqxfDPIyk9bzQ6R8Jb0fdLR1d5Ll1KU6j34O.jpg',NULL,'2026-06-13 20:13:07','2026-06-14 18:53:17'),(48,1,'Frost Bite Cup Cookies','ice_cream',10000.00,5,NULL,1,'canteen_images/Mav8WtSMEKu2MrUd506qxleCCwLjbzUugFfhecO6.jpg',NULL,'2026-06-13 20:13:42','2026-06-14 03:16:58'),(49,1,'Frost Bite Strawberry','ice_cream',10000.00,9,NULL,1,'canteen_images/G26drb8Pb2EaKtQqZpXRKCVT7OQn8Vel2TYa8uhN.jpg',NULL,'2026-06-13 20:14:11','2026-06-14 18:52:03'),(50,1,'Frost Bite Coklat','ice_cream',10000.00,5,NULL,1,'canteen_images/PcMl6xdP2RJQwoMyBXgHKsYsTMqK8wgC9Usv9GoJ.jpg',NULL,'2026-06-13 20:14:30','2026-06-14 03:08:06'),(51,1,'Telur','ingredient',0.00,281,'pcs',0,NULL,NULL,'2026-06-13 23:59:15','2026-06-25 21:23:48'),(52,1,'Nugget','ingredient',0.00,166,'pcs',0,NULL,NULL,'2026-06-14 00:01:07','2026-06-14 18:42:48'),(58,1,'Susu','ingredient',0.00,99,'pcs',0,NULL,NULL,'2026-06-14 00:31:15','2026-06-15 18:33:06'),(59,1,'Teh','ingredient',0.00,98,'pcs',0,NULL,NULL,'2026-06-14 00:31:32','2026-06-15 18:33:18'),(60,1,'Kopi','ingredient',0.00,99,'pcs',0,NULL,NULL,'2026-06-14 00:31:44','2026-06-26 02:29:29'),(61,1,'Nasi Telur','food',10000.00,9999,NULL,1,'canteen_images/4LRrut6wn40vlUrfC2jJH7kzEMQC1h6FMWts0RYZ.jpg','Nasi, Kerupuk, Saos 2, Telur','2026-06-14 00:38:45','2026-06-14 02:21:28'),(62,1,'Mie Goreng','ingredient',0.00,143,'pcs',0,NULL,NULL,'2026-06-14 00:46:44','2026-06-25 21:19:38'),(63,1,'Mie Goreng + Telur','food',15000.00,9999,NULL,1,NULL,'Mie, Kerupuk, Telur, Saos','2026-06-14 00:49:09','2026-06-14 00:49:09'),(64,1,'Nasi Nugget','food',15000.00,9999,NULL,1,NULL,NULL,'2026-06-14 00:49:53','2026-06-14 00:49:53'),(65,1,'Ayam','ingredient',0.00,48,'pcs',0,NULL,NULL,'2026-06-14 00:50:23','2026-06-25 21:23:48'),(66,1,'Nasi Ayam','food',15000.00,9999,NULL,1,'canteen_images/286Lpkma2WmcehVSO1RC38qXSXphU0RguqDlkct4.jpg',NULL,'2026-06-14 00:50:58','2026-06-15 02:16:34'),(67,1,'Nasi','food',5000.00,9999,NULL,1,'canteen_images/95xu2E6Jp2CRr8mZp4YuseskJmnZLvj9S1BX4Zef.jpg',NULL,'2026-06-14 00:51:30','2026-06-14 19:04:11'),(68,1,'Nugget','food',10000.00,9999,NULL,1,NULL,NULL,'2026-06-14 00:52:01','2026-06-14 00:52:13'),(69,1,'Telur','food',5000.00,9999,NULL,1,NULL,'Bisa Ceplok atau Dadar','2026-06-14 00:52:37','2026-06-15 18:38:35'),(70,1,'Mie Goreng','food',10000.00,9999,NULL,1,NULL,NULL,'2026-06-14 00:53:13','2026-06-14 00:53:13'),(71,1,'Es Susu','drink',5000.00,9999,NULL,1,'canteen_images/c4DEzSr5u7bl3p8XDGWVpVwcXo3SEhv7kDzgbVKw.jpg',NULL,'2026-06-14 00:53:44','2026-06-14 02:52:10'),(72,1,'Es Teh','drink',5000.00,9999,NULL,1,'canteen_images/IryRiGBipEQJZtLMZz5j9uKIlMTVDVF6FVSMUtXO.jpg',NULL,'2026-06-14 00:54:09','2026-06-14 02:53:14'),(73,1,'Es Kopi Susu','drink',8000.00,9999,NULL,1,'canteen_images/Z7sGb49e8n0sRf613y2Xk6V4Dq3v0rn6SbjuX1go.jpg',NULL,'2026-06-14 00:54:41','2026-06-14 02:51:19'),(74,1,'Es Teh Susu','drink',8000.00,9999,NULL,1,'canteen_images/KQED3mxvbRTU1IGRulLPKiuk8z0S6pSyBVeemHbj.jpg',NULL,'2026-06-14 00:55:09','2026-06-14 02:53:51'),(75,1,'Es Kopi','drink',5000.00,9999,NULL,1,'canteen_images/UqUqfSYUbW1t8ecqpaiXT7HpaiyBqtrIauDJH11e.jpg',NULL,'2026-06-14 00:55:34','2026-06-14 02:50:29'),(76,1,'Kopi Panas','drink',5000.00,9999,NULL,1,'canteen_images/GvpsRENEpxXRyIwtSCPLwPFzfOy7biNzJ8qEpEoW.jpg',NULL,'2026-06-14 00:56:03','2026-06-14 18:57:22'),(78,1,'Floridina','drink',10000.00,12,NULL,1,'canteen_images/oDNWbwuv8jWb4Ansjq78dOPdlBtcSsL2wsVbVFyx.jpg',NULL,'2026-06-14 01:18:36','2026-06-14 02:54:20'),(79,1,'DK Usagi Puf Caramel','snack',2000.00,30,NULL,1,'canteen_images/iavdxvLcB4M1q5ZZGZfOJ0DuxmsA3iiiW8e7oQ38.jpg',NULL,'2026-06-14 01:20:56','2026-06-14 02:47:38'),(80,1,'Nabati Richesee Keju 16gram','snack',2000.00,30,NULL,1,'canteen_images/0n7IEi3GNYvQL6SPMNhjITu0LLFnyciA54Pejlzy.jpg',NULL,'2026-06-14 01:22:35','2026-06-14 19:03:13'),(81,1,'Bear Brand','drink',10000.00,36,NULL,1,'canteen_images/VYDj1q66DMyF3YqcMcv6VuevGNTXTLpsXG86ocRF.jpg',NULL,'2026-06-14 01:24:45','2026-06-14 02:39:49'),(82,1,'Tujuh Kurma Susu','drink',12000.00,17,NULL,1,'canteen_images/XGxKEjYK6o0G1Vn3e3lBr8sB5q9PfPtN7qTyAWqi.webp',NULL,'2026-06-14 01:26:00','2026-06-16 23:35:35'),(83,1,'Teh Pucuk Harum Melati 500ml','drink',10000.00,24,NULL,1,'canteen_images/6p9qKQoXj7985dlWJpEbD4F5S69Sljmgqhp6j1jN.jpg',NULL,'2026-06-14 01:30:02','2026-06-14 19:06:19'),(84,1,'Mie Rebus','ingredient',0.00,84,'pcs',0,NULL,NULL,'2026-06-14 01:35:35','2026-06-17 19:33:36'),(85,1,'Mie Rebus + Telur','food',15000.00,9999,NULL,1,'canteen_images/3pt1YR9YgWmG4F8ZQIb14FT1pWCDnQiyW3hTJjO3.jpg',NULL,'2026-06-14 01:36:13','2026-06-23 02:43:35'),(87,1,'Aqua Kecil','drink',5000.00,141,NULL,1,'canteen_images/pYZH9Cn0KwEKHetx0W8Bg9NZQmqvMuT8pFPgLlh0.jpg',NULL,'2026-06-14 01:52:53','2026-06-15 01:12:12'),(88,1,'Aqua Besar','drink',12000.00,36,NULL,1,'canteen_images/qsCSGTw3BXrkt8SJkDTzlkbed7PD5rXtU8yfC9jh.jpg',NULL,'2026-06-14 01:53:19','2026-06-26 03:05:30'),(89,1,'Nasi Goreng Special','food',25000.00,9999,NULL,1,'canteen_images/slBHLjuhPNGD8SaVmcD0srbNqca3kqaaHlZ7lMWK.png','Nasi Goreng + Ayam + Telur + Saos 2 + Kerupuk + Timun','2026-06-15 18:34:43','2026-06-23 02:47:55'),(90,1,'Susu Hangat','drink',10000.00,9999,NULL,1,'canteen_images/dOsCQbRFRW3Ngy0sQ0oV25nob07kafpB3jK8vcsY.jpg',NULL,'2026-06-15 18:35:12','2026-06-15 18:52:17'),(91,1,'Mie Rebus','food',10000.00,9999,NULL,1,NULL,NULL,'2026-06-29 02:15:49','2026-06-29 02:16:17');
/*!40000 ALTER TABLE `canteen_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_order_items`
--

DROP TABLE IF EXISTS `canteen_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_order_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `canteen_order_id` bigint unsigned NOT NULL,
  `canteen_item_id` bigint unsigned NOT NULL,
  `quantity` int NOT NULL,
  `price_at_time` decimal(15,2) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `canteen_order_items_canteen_order_id_foreign` (`canteen_order_id`),
  KEY `canteen_order_items_canteen_item_id_foreign` (`canteen_item_id`),
  CONSTRAINT `canteen_order_items_canteen_item_id_foreign` FOREIGN KEY (`canteen_item_id`) REFERENCES `canteen_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `canteen_order_items_canteen_order_id_foreign` FOREIGN KEY (`canteen_order_id`) REFERENCES `canteen_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_order_items`
--

LOCK TABLES `canteen_order_items` WRITE;
/*!40000 ALTER TABLE `canteen_order_items` DISABLE KEYS */;
INSERT INTO `canteen_order_items` VALUES (6,6,1,1,15000.00,'2026-06-11 02:15:44','2026-06-11 02:15:44'),(7,7,1,1,15000.00,'2026-06-11 02:22:32','2026-06-11 02:22:32'),(8,8,1,1,15000.00,'2026-06-11 02:26:20','2026-06-11 02:26:20'),(9,9,1,2,15000.00,'2026-06-11 02:31:21','2026-06-11 02:31:21'),(10,10,1,2,15000.00,'2026-06-11 02:31:57','2026-06-11 02:31:57'),(11,11,1,1,15000.00,'2026-06-11 02:40:11','2026-06-11 02:40:11'),(12,12,1,2,15000.00,'2026-06-11 02:42:29','2026-06-11 02:42:29'),(14,14,1,2,15000.00,'2026-06-12 19:18:56','2026-06-12 19:18:56'),(15,15,1,2,15000.00,'2026-06-12 22:02:03','2026-06-12 22:02:03'),(16,16,1,2,15000.00,'2026-06-12 22:05:33','2026-06-12 22:05:33'),(17,17,1,1,15000.00,'2026-06-13 01:12:10','2026-06-13 01:12:10'),(18,18,1,1,15000.00,'2026-06-13 01:12:58','2026-06-13 01:12:58'),(19,19,1,1,15000.00,'2026-06-13 01:16:47','2026-06-13 01:16:47'),(20,20,1,1,15000.00,'2026-06-13 02:49:36','2026-06-13 02:49:36'),(21,21,28,2,5000.00,'2026-06-14 22:11:22','2026-06-14 22:11:22'),(22,22,28,2,5000.00,'2026-06-14 22:19:34','2026-06-14 22:19:34'),(23,23,28,1,5000.00,'2026-06-14 22:20:15','2026-06-14 22:20:15'),(24,24,28,1,5000.00,'2026-06-14 22:26:42','2026-06-14 22:26:42'),(25,25,28,1,5000.00,'2026-06-14 22:40:52','2026-06-14 22:40:52'),(26,26,28,1,5000.00,'2026-06-14 22:48:45','2026-06-14 22:48:45'),(27,27,28,1,5000.00,'2026-06-14 22:48:45','2026-06-14 22:48:45'),(28,28,28,1,5000.00,'2026-06-14 23:11:28','2026-06-14 23:11:28'),(29,29,3,1,5000.00,'2026-06-15 02:03:09','2026-06-15 02:03:09'),(30,30,28,1,5000.00,'2026-06-15 19:23:55','2026-06-15 19:23:55'),(31,31,28,1,5000.00,'2026-06-15 19:28:01','2026-06-15 19:28:01'),(32,32,28,1,5000.00,'2026-06-15 19:38:19','2026-06-15 19:38:19'),(33,33,28,1,5000.00,'2026-06-15 19:49:34','2026-06-15 19:49:34'),(34,34,28,1,5000.00,'2026-06-15 20:20:13','2026-06-15 20:20:13'),(35,35,36,1,5000.00,'2026-06-16 00:42:39','2026-06-16 00:42:39'),(36,36,89,10,25000.00,'2026-06-17 22:18:04','2026-06-17 22:18:04'),(37,37,89,1,25000.00,'2026-06-18 21:31:50','2026-06-18 21:31:50'),(38,38,67,1,5000.00,'2026-06-25 20:40:37','2026-06-25 20:40:37'),(39,39,67,1,5000.00,'2026-06-25 20:40:39','2026-06-25 20:40:39'),(40,40,67,1,5000.00,'2026-06-25 20:40:40','2026-06-25 20:40:40'),(41,41,67,1,5000.00,'2026-06-25 20:40:42','2026-06-25 20:40:42'),(42,42,67,1,5000.00,'2026-06-25 20:44:06','2026-06-25 20:44:06'),(43,43,67,1,5000.00,'2026-06-25 20:47:00','2026-06-25 20:47:00'),(44,44,70,1,10000.00,'2026-06-25 21:01:36','2026-06-25 21:01:36'),(45,45,76,1,5000.00,'2026-06-25 21:04:20','2026-06-25 21:04:20'),(46,46,63,1,15000.00,'2026-06-25 21:19:38','2026-06-25 21:19:38'),(47,47,89,1,25000.00,'2026-06-25 21:23:48','2026-06-25 21:23:48'),(48,48,76,1,5000.00,'2026-06-26 02:27:04','2026-06-26 02:27:04'),(49,49,76,1,5000.00,'2026-06-26 02:29:29','2026-06-26 02:29:29'),(50,50,88,1,12000.00,'2026-06-26 02:36:50','2026-06-26 02:36:50'),(51,51,88,1,12000.00,'2026-06-26 02:44:58','2026-06-26 02:44:58'),(52,52,88,1,12000.00,'2026-06-26 02:45:00','2026-06-26 02:45:00'),(53,53,88,1,12000.00,'2026-06-26 02:48:03','2026-06-26 02:48:03'),(54,54,88,1,12000.00,'2026-06-26 02:50:12','2026-06-26 02:50:12'),(55,55,88,1,12000.00,'2026-06-26 02:51:39','2026-06-26 02:51:39'),(56,56,88,1,12000.00,'2026-06-26 02:57:04','2026-06-26 02:57:04');
/*!40000 ALTER TABLE `canteen_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `canteen_orders`
--

DROP TABLE IF EXISTS `canteen_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `canteen_orders` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `tenant_id` bigint unsigned DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_proof` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `delivery_method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pickup',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `canteen_orders_order_code_unique` (`order_code`),
  KEY `canteen_orders_branch_id_foreign` (`branch_id`),
  KEY `canteen_orders_tenant_id_foreign` (`tenant_id`),
  CONSTRAINT `canteen_orders_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `canteen_orders_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `canteen_orders`
--

LOCK TABLES `canteen_orders` WRITE;
/*!40000 ALTER TABLE `canteen_orders` DISABLE KEYS */;
INSERT INTO `canteen_orders` VALUES (6,1,22,NULL,'KTN-MNL-KOARMZ',15000.00,'debt','paid','completed',NULL,NULL,'pickup','2026-06-11 02:15:44','2026-06-11 02:15:44'),(7,1,22,NULL,'KTN-MNL-RWM6P3',15000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:22:32','2026-06-11 03:02:54'),(8,1,22,NULL,'KTN-MNL-AQ5XV6',15000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:26:20','2026-06-11 03:02:53'),(9,1,22,NULL,'KTN-MNL-GQGH9D',30000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:31:21','2026-06-11 03:02:50'),(10,1,22,NULL,'KTN-MNL-MJSCDU',30000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:31:57','2026-06-11 03:02:50'),(11,1,22,NULL,'KTN-MNL-HVE9WZ',15000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:40:11','2026-06-11 03:02:48'),(12,1,22,NULL,'KTN-MNL-2IXYQU',30000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-11 02:42:29','2026-06-11 03:02:46'),(14,1,22,NULL,'KTN-EAWF9X9AH7',30000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-12 19:18:56','2026-06-12 19:19:55'),(15,1,3,NULL,'KTN-MNL-L7CQX3',30000.00,'qris','paid','completed','canteen_payments/ig4XKAZbMopnaoD2Xi61I90oYO9HsiW39503lHbp.png',NULL,'pickup','2026-06-12 22:02:03','2026-06-12 22:04:10'),(16,1,3,NULL,'KTN-FSKX99MBFQ',30000.00,'cash','paid','completed','canteen_payments/jztnrlrVLRSt6hIXkmD2jnqBewPyTZbJocrMO6xb.jpg',NULL,'delivery','2026-06-12 22:05:33','2026-06-14 22:22:04'),(17,1,24,NULL,'KTN-XHMUBHB4H1',15000.00,'cash','free_meal','completed',NULL,NULL,'delivery','2026-06-13 01:12:10','2026-06-13 01:12:10'),(18,1,24,NULL,'KTN-WVT5V2XJUQ',15000.00,'cash','free_meal','completed',NULL,NULL,'delivery','2026-06-13 01:12:58','2026-06-13 01:12:58'),(19,1,24,NULL,'KTN-KYIHGXY3R8',15000.00,'cash','free_meal','completed',NULL,NULL,'delivery','2026-06-13 01:16:47','2026-06-13 01:16:47'),(20,1,24,NULL,'KTN-X6XB6FF93C',15000.00,'cash','free_meal','completed',NULL,NULL,'delivery','2026-06-13 02:49:36','2026-06-13 02:49:36'),(21,1,22,NULL,'KTN-L7ZF8A1SMP',10000.00,'qris','paid','completed','canteen_payments/IeJijrviObApGoDKyY5dFg9ZFqsAiUzS99ZP1mar.jpg',NULL,'delivery','2026-06-14 22:11:22','2026-06-14 22:12:16'),(22,1,22,NULL,'KTN-XLGOY3MNQP',10000.00,'qris','paid','completed','canteen_payments/RV9U2Y0ta8wDklzbmkxMk7ZzidvjIShf96XmwETJ.jpg',NULL,'delivery','2026-06-14 22:19:34','2026-06-14 22:20:00'),(23,1,22,NULL,'KTN-RAI2WLSBA5',5000.00,'qris','cancelled','cancelled','canteen_payments/KVOBPU9hXdWyI4Hu82g1TXdcI1HFvShwLoZBlJOw.jpg',NULL,'delivery','2026-06-14 22:20:15','2026-06-14 22:26:15'),(24,1,22,NULL,'KTN-KSNULWKSYV',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-14 22:26:42','2026-06-14 22:40:37'),(25,1,22,NULL,'KTN-PN5TNY0GHZ',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-14 22:40:52','2026-06-14 22:41:57'),(26,1,22,NULL,'KTN-R0YOXMSIAR',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-14 22:48:45','2026-06-14 22:55:01'),(27,1,22,NULL,'KTN-VRV8G8QF7P',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-14 22:48:45','2026-06-14 22:55:05'),(28,1,22,NULL,'KTN-D5QVWVV6N7',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-14 23:11:28','2026-06-14 23:12:21'),(29,1,3,NULL,'KTN-MNL-WA84IY',5000.00,'qris','cancelled','cancelled',NULL,NULL,'pickup','2026-06-15 02:03:09','2026-06-15 02:03:19'),(30,1,22,NULL,'KTN-0PNOXYQ0LY',5000.00,'qris','paid','completed','canteen_payments/p6sOF10nsIRZuipHSeM84q5pUJSp98TBvZKRzfWu.jpg','Ceplok','pickup','2026-06-15 19:23:55','2026-06-15 19:25:09'),(31,1,22,NULL,'KTN-JVNIF9GRPM',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-15 19:28:01','2026-06-15 19:30:34'),(32,1,22,NULL,'KTN-WHVEDEL1AW',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-15 19:38:19','2026-06-15 19:38:55'),(33,1,22,NULL,'KTN-WI4AV7YJYD',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-15 19:49:34','2026-06-15 19:51:37'),(34,1,22,NULL,'KTN-65YU4OLQPP',5000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-15 20:20:13','2026-06-15 20:24:48'),(35,1,3,NULL,'KTN-MNL-XUFQTJ',5000.00,'cash','paid','completed',NULL,NULL,'pickup','2026-06-16 00:42:39','2026-06-28 23:51:52'),(36,1,3,NULL,'KTN-ZBLMXBKSR0',250000.00,'cash','cancelled','cancelled',NULL,NULL,'delivery','2026-06-17 22:18:04','2026-06-17 22:18:10'),(37,1,3,NULL,'KTN-EXY8IM4B7H',25000.00,'cash','paid','completed',NULL,NULL,'delivery','2026-06-18 21:31:50','2026-06-28 23:51:48'),(38,1,28,NULL,'KTN-DOAP8LFHAO',5000.00,'qris','cancelled','cancelled','canteen_payments/5RIf2dJ3hKR8dJ9soz5l1FSkZ3eUyUggfpluLT6B.png','jangan pedas','delivery','2026-06-25 20:40:37','2026-06-25 20:41:42'),(39,1,28,NULL,'KTN-KJRANHLMWE',5000.00,'qris','cancelled','cancelled','canteen_payments/PxfDmr8c3zPEamfvMtPoOkSypUhPA2DGFJtGu7MW.png','jangan pedas','delivery','2026-06-25 20:40:39','2026-06-25 20:41:36'),(40,1,28,NULL,'KTN-LLEY7NHISF',5000.00,'qris','cancelled','cancelled','canteen_payments/VznGGWwzccZp810iSgP4IZDmmKRQVGbndcKM35lc.png','jangan pedas','delivery','2026-06-25 20:40:40','2026-06-25 20:41:40'),(41,1,28,NULL,'KTN-TYXIQVLAQ6',5000.00,'qris','cancelled','cancelled','canteen_payments/WZwHqJYRv3XstbffcRrq8Tg5MF8FlRB5dd9sOiso.png','jangan pedas','delivery','2026-06-25 20:40:42','2026-06-25 20:41:34'),(42,1,28,NULL,'KTN-LZIHUD7CNC',5000.00,'qris','cancelled','cancelled','canteen_payments/bUDQOkmXbCal5p0eyMyBxocKKzExb2jQPObgzFmE.jpg','Jangan Pedas','pickup','2026-06-25 20:44:06','2026-06-25 20:44:25'),(43,1,28,NULL,'KTN-Y1OSRFURXQ',5000.00,'qris','paid','completed','canteen_payments/sAbfhSJb4etTDNM4VTAsMlnas2x7bmWCHYJaPBtE.jpg','nasi aja','pickup','2026-06-25 20:47:00','2026-06-25 20:48:54'),(44,1,28,NULL,'KTN-BUKD4LPBDG',10000.00,'qris','cancelled','cancelled','canteen_payments/1OKjKSrsXBrKueAL8qQ3mqGxmLZv2ueNuk9j4Dmv.jpg','telor dadar','pickup','2026-06-25 21:01:36','2026-06-25 21:03:30'),(45,1,28,NULL,'KTN-M0O15XOKJL',5000.00,'qris','cancelled','cancelled','canteen_payments/FbgpPjdd6p7FUCxxSGuV36UOOc6fjwAUv7YmGVHw.jpg','ceplok pedes','pickup','2026-06-25 21:04:20','2026-06-25 21:05:14'),(46,1,28,NULL,'KTN-Q8WGRBXBPV',15000.00,'qris','paid','completed','canteen_payments/xCaHAjSzTNsS3g9tG4igxWOyEXtM5Rf5anLzj6KD.jpg','cepet laper','delivery','2026-06-25 21:19:38','2026-06-25 21:22:42'),(47,1,28,NULL,'KTN-FTCTRQVZPI',25000.00,'qris','paid','completed','canteen_payments/ZrohoDt85y5FrEATpiKGCgUwTe1Wc61s7ES7vQLP.jpg','nih','delivery','2026-06-25 21:23:48','2026-06-26 02:19:04'),(48,1,28,NULL,'KTN-QGUHG37CRJ',5000.00,'qris','cancelled','cancelled','canteen_payments/StO9oXb0VF6QhEdlLTAI8ryHnGUkJQQTjiTztegk.jpg','bakar','pickup','2026-06-26 02:27:04','2026-06-26 02:27:31'),(49,1,28,NULL,'KTN-KXY27GPSOX',5000.00,'qris','paid','completed','canteen_payments/SKwz5j2JgjlwQsfN8BAgEwoJyzxnKeyHIZfWvauC.jpg','bakar','pickup','2026-06-26 02:29:29','2026-06-26 02:36:04'),(50,1,28,NULL,'KTN-FS3BPZB8EA',12000.00,'qris','debt_unpaid','cancelled','canteen_payments/s6NH6iqul4VpJMc8dQ82m7XudRThT8owWIoezNzt.jpg',NULL,'pickup','2026-06-26 02:36:50','2026-06-26 02:37:20'),(51,1,28,NULL,'KTN-HZZCMOXSQ3',12000.00,'qris','cancelled','cancelled','canteen_payments/h0F3JidYeD3M75GMdVtfhdReqBqoObaORPPE6G0S.jpg','bayar','pickup','2026-06-26 02:44:58','2026-06-26 02:45:29'),(52,1,28,NULL,'KTN-YAC4SOYVOB',12000.00,'qris','cancelled','cancelled','canteen_payments/RRZCorGXINZuBkpmQGzoL8c1Qdhu8KepXlKwaoFC.jpg','bayar','pickup','2026-06-26 02:45:00','2026-06-26 02:45:16'),(53,1,28,NULL,'KTN-IIODDJJD0H',12000.00,'qris','paid','completed','canteen_payments/lTlYBxgS1aQ5hcg78ViO3IFBItwonyBYpX7vk8dL.jpg','bubar','delivery','2026-06-26 02:48:03','2026-06-26 02:49:16'),(54,1,28,NULL,'KTN-MNL-ZF03MA',12000.00,'cash','debt_unpaid','completed',NULL,NULL,'pickup','2026-06-26 02:50:12','2026-06-27 00:09:44'),(55,1,28,NULL,'KTN-MNL-UQFWEQ',12000.00,'cash','debt_unpaid','completed',NULL,NULL,'pickup','2026-06-26 02:51:39','2026-06-27 00:09:40'),(56,1,28,NULL,'KTN-MNL-BWFWIS',12000.00,'cash','cancelled','cancelled',NULL,NULL,'pickup','2026-06-26 02:57:04','2026-06-26 03:05:30');
/*!40000 ALTER TABLE `canteen_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `complaints`
--

DROP TABLE IF EXISTS `complaints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `complaints` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint unsigned NOT NULL,
  `room_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `repair_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `admin_response` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `complaints_tenant_id_foreign` (`tenant_id`),
  KEY `complaints_room_id_foreign` (`room_id`),
  CONSTRAINT `complaints_room_id_foreign` FOREIGN KEY (`room_id`) REFERENCES `rooms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `complaints_tenant_id_foreign` FOREIGN KEY (`tenant_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `complaints`
--

LOCK TABLES `complaints` WRITE;
/*!40000 ALTER TABLE `complaints` DISABLE KEYS */;
INSERT INTO `complaints` VALUES (1,3,3,'bocor','keran bocor','ready',NULL,'repair_done.png','otw','2026-06-19 02:28:30','2026-06-19 02:39:28'),(2,3,3,'kamar mandi','selang flush bocor','ready','complaints/hfJ3eGupmpupZOnvnfOIAHqFeEBs8ohw2rdmVMgr.mp4','repair_done.png','silakan di nikmati','2026-06-23 20:56:34','2026-06-23 21:04:52');
/*!40000 ALTER TABLE `complaints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `failed_jobs`
--

DROP TABLE IF EXISTS `failed_jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `failed_jobs`
--

LOCK TABLES `failed_jobs` WRITE;
/*!40000 ALTER TABLE `failed_jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `failed_jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `faqs`
--

DROP TABLE IF EXISTS `faqs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `faqs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `question` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `faqs`
--

LOCK TABLES `faqs` WRITE;
/*!40000 ALTER TABLE `faqs` DISABLE KEYS */;
INSERT INTO `faqs` VALUES (1,'Apakah ada jam malam di Kospart?','Kospart menyediakan akses 24 jam untuk setiap penghuni. Namun, kami memohon agar penghuni tetap menjaga ketenangan saat larut malam demi kenyamanan bersama.',1,1,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(2,'Apakah tamu boleh menginap?','Tamu diperbolehkan berkunjung di area umum hingga pukul 22.00 WIB. Jika ada keluarga/tamu yang menginap, mohon melapor ke pengelola maksimal H-1 (terdapat biaya tambahan untuk tamu menginap).',1,2,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(3,'Fasilitas apa saja yang sudah termasuk dalam harga sewa?','Harga sewa bulanan sudah termasuk fasilitas kamar full-furnished, air bersih, WiFi kecepatan tinggi, serta akses ke fasilitas umum (dapur bersama, ruang santai, parkiran). Token listrik diisi sendiri oleh masing-masing penghuni.',1,3,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(4,'Bagaimana prosedur perpanjang sewa bulanan?','Sistem Kospart akan mengirimkan notifikasi pengingat secara otomatis H-7 sebelum masa sewa Anda berakhir. Anda dapat langsung membayar tagihan perpanjangan sewa melalui sistem dashboard.',1,4,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(5,'Apakah parkiran aman untuk kendaraan?','Sangat aman. Kospart menyediakan area parkir motor dan mobil yang luas, tertutup, dan terpantau oleh kamera CCTV selama 24 jam non-stop.',1,5,'2026-06-14 20:17:23','2026-06-14 20:17:23');
/*!40000 ALTER TABLE `faqs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finances`
--

DROP TABLE IF EXISTS `finances`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `transaction_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receipt_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transaction_date` date NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `booking_id` bigint unsigned DEFAULT NULL,
  `canteen_order_id` bigint unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `branch_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `finances_booking_id_foreign` (`booking_id`),
  KEY `finances_branch_id_foreign` (`branch_id`),
  KEY `finances_canteen_order_id_foreign` (`canteen_order_id`),
  CONSTRAINT `finances_booking_id_foreign` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE SET NULL,
  CONSTRAINT `finances_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `finances_canteen_order_id_foreign` FOREIGN KEY (`canteen_order_id`) REFERENCES `canteen_orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=88 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finances`
--

LOCK TABLES `finances` WRITE;
/*!40000 ALTER TABLE `finances` DISABLE KEYS */;
INSERT INTO `finances` VALUES (1,'income',1200000.00,NULL,NULL,'rental','2026-06-11','Pembayaran Harian Kamar 100 - muhamad rifqi al ardabili',41,NULL,'2026-06-11 00:14:07','2026-06-11 00:14:07',1),(2,'expense',200000.00,NULL,NULL,'restock_kantin','2026-06-11','Belanja awal stok kantin: beras (5000 pcs)',NULL,NULL,'2026-06-11 02:11:14','2026-06-11 02:11:14',1),(10,'income',1400000.00,NULL,NULL,'rental','2026-06-13','Penyewaan Kamar 05 oleh muhamad rifqi al ardabili (Manual)',42,NULL,'2026-06-12 18:49:17','2026-06-12 18:49:17',1),(12,'income',1800000.00,NULL,NULL,'rental','2026-06-13','Pembayaran Bulanan Kamar 03 (Transfer Bank) - M. Farhan',22,NULL,'2026-06-12 21:33:02','2026-06-12 21:33:02',1),(13,'income',500000.00,NULL,NULL,'rental','2026-06-13','Pembayaran Bulanan Kamar 03 - M. Farhan',22,NULL,'2026-06-12 21:37:18','2026-06-12 21:37:18',1),(15,'expense',100000.00,NULL,NULL,'electricity','2026-06-13','Beli token',NULL,NULL,'2026-06-12 22:10:18','2026-06-12 22:10:18',1),(16,'income',1700000.00,NULL,NULL,'rental','2026-06-13','Pembayaran Bulanan Kamar 02 - Eni Latifah',21,NULL,'2026-06-13 00:07:39','2026-06-13 00:07:39',1),(17,'income',850000.00,NULL,NULL,'rental','2026-06-13','Pembayaran Mingguan Kamar 100 - muhamad rifqi al ardabili',43,NULL,'2026-06-13 00:37:47','2026-06-13 00:37:47',1),(18,'income',1700000.00,NULL,NULL,'rental','2026-06-13','Pembayaran Bulanan Kamar 02 - Eni Latifah',21,NULL,'2026-06-13 04:35:16','2026-06-13 04:35:16',1),(19,'income',250000.00,NULL,NULL,'rental','2026-06-14','Pembayaran Harian Kamar 05 - peachy',NULL,NULL,'2026-06-13 23:17:33','2026-06-13 23:17:33',1),(20,'income',850000.00,NULL,NULL,'rental','2026-06-14','Penyewaan Kamar 100 oleh HANNA AGUSTYA PERMATASARI (Manual)',45,NULL,'2026-06-14 04:29:59','2026-06-14 04:29:59',1),(21,'income',800000.00,NULL,NULL,'rental','2026-06-14','Penyewaan Kamar 05 oleh HANNA AGUSTYA PERMATASARI (Manual)',46,NULL,'2026-06-14 04:33:42','2026-06-14 04:33:42',1),(22,'expense',100000.00,NULL,NULL,'other','2026-06-15','Beli Bensin',NULL,NULL,'2026-06-14 20:29:21','2026-06-14 20:29:21',1),(32,'income',15000.00,'debt',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-KOARMZ',41,6,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(33,'income',15000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-RWM6P3',41,7,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(34,'income',15000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-AQ5XV6',41,8,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(35,'income',30000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-GQGH9D',41,9,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(36,'income',30000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-MJSCDU',41,10,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(37,'income',15000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-HVE9WZ',41,11,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(38,'income',30000.00,'cash',NULL,'pendapatan_kantin','2026-06-11','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-MNL-2IXYQU',41,12,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(39,'income',30000.00,'cash',NULL,'pendapatan_kantin','2026-06-13','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-EAWF9X9AH7',41,14,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(40,'income',30000.00,'qris',NULL,'pendapatan_kantin','2026-06-13','Pendapatan kantin dari M. Farhan (Kamar 03) - KTN-MNL-L7CQX3',22,15,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(41,'income',30000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari M. Farhan (Kamar 03) - KTN-FSKX99MBFQ',22,16,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(42,'income',10000.00,'qris',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-L7ZF8A1SMP',41,21,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(43,'income',10000.00,'qris',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-XLGOY3MNQP',41,22,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(44,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-KSNULWKSYV',41,24,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(45,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-PN5TNY0GHZ',41,25,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(46,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-R0YOXMSIAR',41,26,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(47,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-VRV8G8QF7P',41,27,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(48,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-15','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-D5QVWVV6N7',41,28,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(49,'income',5000.00,'qris',NULL,'pendapatan_kantin','2026-06-16','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-0PNOXYQ0LY',41,30,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(50,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-16','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-JVNIF9GRPM',41,31,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(51,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-16','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-WHVEDEL1AW',41,32,'2026-06-15 19:44:57','2026-06-15 19:44:57',1),(52,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-16','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-WI4AV7YJYD',41,33,'2026-06-15 19:51:37','2026-06-15 19:51:37',1),(53,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-16','Pendapatan kantin dari muhamad rifqi al ardabili (Kamar 100) - KTN-65YU4OLQPP',41,34,'2026-06-15 20:24:48','2026-06-15 20:24:48',1),(54,'expense',25000.00,'cash',NULL,'electricity','2026-06-16','Beli Token',NULL,NULL,'2026-06-15 21:37:17','2026-06-15 21:37:17',1),(55,'expense',25000.00,'cash','images/receipts/1781584761_images (3).jpg','electricity','2026-06-16','Beli Token',NULL,NULL,'2026-06-15 21:39:21','2026-06-15 21:39:21',1),(56,'income',1800000.00,'transfer',NULL,'rental','2026-06-16','Pembayaran Bulanan Kamar 23 - Andin',39,NULL,'2026-06-16 02:14:28','2026-06-16 02:14:28',1),(57,'income',500000.00,'cash',NULL,'rental','2026-06-18','Pembayaran Bulanan Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-17 20:45:48','2026-06-17 20:45:48',1),(58,'income',100000.00,'cash',NULL,'rental','2026-06-18','Pembayaran Bulanan Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-17 22:56:58','2026-06-17 22:56:58',1),(59,'income',1800000.00,'cash',NULL,'rental','2026-06-19','Perpanjangan Bulanan Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-18 20:53:02','2026-06-18 20:53:02',1),(60,'income',900000.00,'cash',NULL,'rental','2026-06-19','Pembayaran Bulanan Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-18 22:59:03','2026-06-18 22:59:03',1),(61,'income',100000.00,'transfer',NULL,'rental','2026-06-19','Pembayaran Bulanan Kamar 03 - M. Farhan',22,NULL,'2026-06-18 23:04:16','2026-06-18 23:04:16',1),(62,'income',1800000.00,'cash',NULL,'rental','2026-06-21','Perpanjangan Bulanan Kamar 08 (Tunai) - Hanny',25,NULL,'2026-06-21 07:19:09','2026-06-21 07:19:09',1),(63,'income',400000.00,'cash',NULL,'rental','2026-06-21','Perpanjangan Harian Kamar 05 (Tunai) - HANNA AGUSTYA PERMATASARI',46,NULL,'2026-06-21 07:19:44','2026-06-21 07:19:44',1),(67,'income',1800000.00,'cash',NULL,'rental','2026-06-22','Perpanjangan Bulanan Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-21 19:36:55','2026-06-21 19:36:55',1),(68,'income',200000.00,'cash',NULL,'rental','2026-06-22','Perpanjangan Harian Kamar 03 (Tunai) - M. Farhan',22,NULL,'2026-06-21 19:41:08','2026-06-21 19:41:08',1),(69,'income',1200000.00,'transfer',NULL,'rental','2026-06-22','Pembayaran Bulanan Kamar 100 - test',NULL,NULL,'2026-06-21 22:35:57','2026-06-21 22:35:57',1),(70,'income',800000.00,'transfer',NULL,'rental','2026-06-22','Pembayaran Bulanan Kamar 100 - test',NULL,NULL,'2026-06-21 22:40:20','2026-06-21 22:40:20',1),(71,'income',200000.00,'transfer',NULL,'rental','2026-06-22','Pembayaran Bulanan Kamar 100 - test',NULL,NULL,'2026-06-21 22:43:09','2026-06-21 22:43:09',1),(72,'income',800000.00,'transfer',NULL,'rental','2026-06-24','Perpanjangan Mingguan Kamar 05 (Transfer Bank) - HANNA AGUSTYA PERMATASARI',46,NULL,'2026-06-23 18:53:05','2026-06-23 18:53:05',1),(73,'income',1200000.00,'transfer',NULL,'rental','2026-06-24','Pembayaran Bulanan Kamar 100 - test',49,NULL,'2026-06-23 23:36:51','2026-06-23 23:36:51',1),(74,'income',1200000.00,'transfer',NULL,'rental','2026-06-24','Pembayaran Bulanan Kamar 100 - test',49,NULL,'2026-06-23 23:44:13','2026-06-23 23:44:13',1),(75,'income',1400000.00,'transfer',NULL,'rental','2026-06-25','Perpanjangan Bulanan Kamar 14 (Transfer Bank) - Hanafi',30,NULL,'2026-06-24 18:50:51','2026-06-24 18:50:51',1),(76,'income',100000.00,'cash',NULL,'rental','2026-06-25','Pembayaran Bulanan Kamar 14 (Tunai) - Hanafi',30,NULL,'2026-06-24 18:52:06','2026-06-24 18:52:06',1),(77,'income',1800000.00,'transfer',NULL,'rental','2026-06-25','Perpanjangan Bulanan Kamar 18 (Transfer Bank) - Citania',34,NULL,'2026-06-24 18:53:59','2026-06-24 18:53:59',1),(80,'income',15000.00,'qris',NULL,'pendapatan_kantin','2026-06-26','Pendapatan kantin dari test (Kamar 100) - KTN-Q8WGRBXBPV',49,46,'2026-06-25 21:20:24','2026-06-25 21:20:24',1),(81,'income',25000.00,'qris',NULL,'pendapatan_kantin','2026-06-26','Pendapatan kantin dari test (Kamar 100) - KTN-FTCTRQVZPI',49,47,'2026-06-26 02:19:04','2026-06-26 02:19:04',1),(82,'income',5000.00,'qris',NULL,'pendapatan_kantin','2026-06-26','Pendapatan kantin dari test (Kamar 100) - KTN-KXY27GPSOX',49,49,'2026-06-26 02:35:56','2026-06-26 02:35:56',1),(84,'income',1850000.00,'transfer',NULL,'rental','2026-06-29','Perpanjangan Bulanan Kamar 17 (Transfer Bank) - Dendy',33,NULL,'2026-06-28 19:29:45','2026-06-28 19:29:45',1),(85,'income',1800000.00,'transfer',NULL,'rental','2026-06-29','Perpanjangan Bulanan Kamar 20 (Transfer Bank) - M. Kairi',36,NULL,'2026-06-28 20:01:59','2026-06-28 20:01:59',1),(86,'income',25000.00,'cash',NULL,'pendapatan_kantin','2026-06-29','Pendapatan kantin dari M. Farhan (Kamar 03) - KTN-EXY8IM4B7H',22,37,'2026-06-28 23:51:48','2026-06-28 23:51:48',1),(87,'income',5000.00,'cash',NULL,'pendapatan_kantin','2026-06-29','Pendapatan kantin dari M. Farhan (Kamar 03) - KTN-MNL-XUFQTJ',22,35,'2026-06-28 23:51:52','2026-06-28 23:51:52',1);
/*!40000 ALTER TABLE `finances` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `job_batches`
--

DROP TABLE IF EXISTS `job_batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `job_batches`
--

LOCK TABLES `job_batches` WRITE;
/*!40000 ALTER TABLE `job_batches` DISABLE KEYS */;
/*!40000 ALTER TABLE `job_batches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `jobs`
--

DROP TABLE IF EXISTS `jobs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_index` (`queue`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `jobs`
--

LOCK TABLES `jobs` WRITE;
/*!40000 ALTER TABLE `jobs` DISABLE KEYS */;
/*!40000 ALTER TABLE `jobs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `migrations`
--

DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `migrations`
--

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'0001_01_01_000000_create_users_table',1),(2,'0001_01_01_000001_create_cache_table',1),(3,'0001_01_01_000002_create_jobs_table',1),(4,'2026_06_07_000001_create_branches_table',1),(5,'2026_06_07_000002_create_rooms_table',1),(6,'2026_06_07_000003_create_bookings_table',1),(7,'2026_06_07_000004_create_complaints_table',1),(8,'2026_06_07_000005_create_finances_table',1),(9,'2026_06_07_152044_add_verification_columns_to_bookings_table',1),(10,'2026_06_07_160008_add_media_to_rooms_table',1),(11,'2026_06_08_035455_add_media_to_branches_table',1),(12,'2026_06_08_065914_add_branch_id_to_finances_table',1),(13,'2026_06_08_075904_create_canteen_items_table',1),(14,'2026_06_08_075914_create_canteen_orders_table',1),(15,'2026_06_08_080102_create_canteen_order_items_table',1),(16,'2026_06_09_042402_add_nik_and_ktp_to_users_table',1),(17,'2026_06_09_060930_add_unit_to_canteen_items_table',1),(18,'2026_06_09_064814_create_canteen_item_recipes_table',1),(19,'2026_06_09_094346_create_faqs_table',1),(20,'2026_06_10_090908_create_virtual_tours_table',2),(21,'2026_06_10_090932_create_testimonials_table',2),(22,'2026_06_11_015556_alter_canteen_orders_add_customer_name',3),(23,'2026_06_11_021712_alter_branches_maps_link_to_text',4),(24,'2026_06_11_024313_add_prices_to_bookings_table',5),(25,'2026_06_11_030257_change_video_to_videos_in_rooms_table',6),(26,'2026_06_13_062857_add_weekly_yearly_prices_to_rooms_table',7),(27,'2026_06_13_063110_add_weekly_yearly_prices_to_bookings_table',8),(28,'2026_06_15_061942_add_price_weekend_to_rooms_and_bookings_table',9),(29,'2026_06_16_020732_add_payment_method_to_finances_table',10),(30,'2026_06_16_024254_add_canteen_order_id_to_finances_table',11),(31,'2026_06_16_042953_add_receipt_path_to_finances_table',12),(32,'2026_06_24_015839_add_invoice_items_to_bookings_table',13),(33,'2026_06_25_000001_create_settings_table',14);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `password_reset_tokens`
--

DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `password_reset_tokens`
--

LOCK TABLES `password_reset_tokens` WRITE;
/*!40000 ALTER TABLE `password_reset_tokens` DISABLE KEYS */;
/*!40000 ALTER TABLE `password_reset_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rooms`
--

DROP TABLE IF EXISTS `rooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rooms` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` bigint unsigned NOT NULL,
  `room_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_monthly` decimal(12,2) NOT NULL,
  `price_yearly` decimal(12,2) NOT NULL DEFAULT '0.00',
  `price_weekend` decimal(12,2) NOT NULL DEFAULT '0.00',
  `price_daily` decimal(12,2) NOT NULL,
  `price_weekly` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'available',
  `facilities` json DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `photos` json DEFAULT NULL,
  `videos` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `rooms_branch_id_foreign` (`branch_id`),
  CONSTRAINT `rooms_branch_id_foreign` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rooms`
--

LOCK TABLES `rooms` WRITE;
/*!40000 ALTER TABLE `rooms` DISABLE KEYS */;
INSERT INTO `rooms` VALUES (2,1,'02',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"WiFi\", \"TV\", \"Kamar Mandi\", \"Lemari\", \"Meja\", \"Water Heater\", \"Kasur\", \"Tong Sampah\"]',NULL,NULL,'2026-06-10 20:15:33','2026-06-15 02:57:40','[\"/storage/room_photos/8Iqizz1fcay8vZDTNyxHykOyeIWN2StJj2jpvSze.jpg\", \"/storage/room_photos/4uXXw4atIYorFzEcMEp6tLcginnopZeHN2qGBfeA.jpg\"]','[\"/storage/room_videos/esghwghkIIfdQN5laPHLYs6lAperzYv0R5nLNn6W.mp4\"]'),(3,1,'03',1800000.00,12000000.00,250000.00,200000.00,800000.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-23 21:01:55',NULL,NULL),(4,1,'05',1800000.00,12000000.00,0.00,200000.00,800000.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 19:24:25',NULL,NULL),(5,1,'07',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(6,1,'08',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed Uk 180\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 23:40:27',NULL,NULL),(7,1,'09',2500000.00,0.00,0.00,250000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed Uk 180\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 23:40:38',NULL,NULL),(8,1,'10',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(9,1,'11',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(10,1,'12',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(11,1,'14',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(12,1,'15',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(13,1,'16',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed Uk 180\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 23:40:51',NULL,NULL),(14,1,'17',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(15,1,'18',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(16,1,'19',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(17,1,'20',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(18,1,'21',2000000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed Uk 180\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 23:41:00',NULL,NULL),(19,1,'22',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(20,1,'23',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed Uk 180\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-28 23:41:12',NULL,NULL),(21,1,'24',1800000.00,0.00,0.00,200000.00,0.00,'occupied','[\"AC\", \"TV\", \"Kamar Mandi Dalam\", \"Kasur Springbed\", \"Lemari\", \"Meja Belajar\"]','Kamar Eksklusif Lengkap',NULL,'2026-06-10 21:23:59','2026-06-15 02:57:40','[]','[]'),(22,1,'100',1800000.00,0.00,250000.00,200000.00,0.00,'occupied','[\"adjobgkw;eb jwrhbw\"]',NULL,NULL,'2026-06-11 00:09:57','2026-06-28 19:21:02',NULL,NULL);
/*!40000 ALTER TABLE `rooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('5yEAZ9VzsiR4qJFDwv7DSElACv9WBs3FpS5buQHy',1,'127.0.0.1','Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1','eyJfdG9rZW4iOiJLb0RZdUxzT2ZXRkEyM3hsa3BLS21odWxkMTY3NmRzVFNocU0xVmhDIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9hcGlcL2ZpbmFuY2VzXC9jaGFydCIsInJvdXRlIjoiZ2VuZXJhdGVkOjp3Rzh0d1dYOHhsZm5veXVqIn0sIl9mbGFzaCI6eyJvbGQiOltdLCJuZXciOltdfSwibG9naW5fd2ViXzU5YmEzNmFkZGMyYjJmOTQwMTU4MGYwMTRjN2Y1OGVhNGUzMDk4OWQiOjF9',1782447310),('B44rwssTUWY36T1oExL0FeKv7LLvvkQLYQMajPU8',28,'127.0.0.1','Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36','eyJfdG9rZW4iOiJZdUhYempRWldkaFhxN2NTNHRFaVFkRkh5VVA3SUx4VmtCa3hQSWlEIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119LCJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI6MjgsIl9wcmV2aW91cyI6eyJ1cmwiOiJodHRwOlwvXC8xMjcuMC4wLjE6ODAwMFwvYXBpXC9maW5hbmNlc1wvY2hhcnQiLCJyb3V0ZSI6ImdlbmVyYXRlZDo6d0c4dHdXWDh4bGZub3l1aiJ9fQ==',1782447310);
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `settings` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES ('bank_account_holder','PRAYOGA HERIYANTO','Nama Pemilik Rekening','2026-06-24 21:50:07','2026-06-24 21:50:07'),('bank_account_name','BCA','Nama Bank untuk Transfer','2026-06-24 21:50:07','2026-06-24 21:50:07'),('bank_account_number','8447060961','Nomor Rekening Bank','2026-06-24 21:50:07','2026-06-24 21:50:07'),('whatsapp_number','628980598327','Nomor WhatsApp Admin (format: 628xxx tanpa +)','2026-06-24 21:50:07','2026-06-24 21:50:07');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rating` int NOT NULL DEFAULT '5',
  `date_text` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `text` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `badge` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
INSERT INTO `testimonials` VALUES (1,'Andi Pratama','Mahasiswa','≡ƒºæΓÇì≡ƒÄô',5,'Desember 2025','Kospart benar-benar bikin nyaman! Kamarnya selalu bersih, wifi stabil banget buat nugas, dan paling seneng karena ada kantin di dalamnya.','Penghuni Lama',1,1,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(2,'Rini Yulianti','Karyawan Swasta','≡ƒæ⌐ΓÇì≡ƒÆ╝',5,'Januari 2026','Lokasinya sangat strategis buat saya yang kerjanya sering pulang malam. Keamanannya terjamin dengan CCTV dan pengelolanya juga ramah banget.','Penghuni Aktif',2,1,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(3,'Bima Sakti','Freelancer','≡ƒºæΓÇì≡ƒÆ╗',4,'Februari 2026','Secara keseluruhan sangat memuaskan. Area parkirnya luas dan aman. Suasananya juga tenang jadi enak banget buat dipakai kerja WFH.','',3,1,'2026-06-14 20:17:23','2026-06-14 20:17:23'),(4,'Citra Amelia','Mahasiswi','≡ƒæ⌐ΓÇì≡ƒÄô',5,'Maret 2026','Fasilitas kamarnya lengkap banget, tinggal bawa koper langsung bisa nempatin. Dan yang paling penting harganya masuk akal dengan fasilitas se-oke ini.','Penghuni Baru',4,1,'2026-06-14 20:17:23','2026-06-14 20:17:23');
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'resident',
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nik` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ktp_photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_branches` json DEFAULT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=29 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Super Admin Kospart','admin@kospart.com',NULL,'$2y$12$0PnAzmYQ4hP2gE2J/IRsNOGj5ijmjthOs69Cx54jNKI.9Kce8VXey','super_admin','081234567890',NULL,NULL,NULL,NULL,NULL,'2026-06-10 02:05:30','2026-06-10 02:05:30'),(2,'Eni Latifah','082242533266@kospart.com',NULL,'$2y$12$.E4eRxa.xwryIgoeovZ.xuehIxFGXETlGpOvEQ7H687i.1fWbVXBO','resident','082242533266',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:58','2026-06-10 21:59:20'),(3,'M. Farhan','085179629110@kospart.com',NULL,'$2y$12$VsONB7VAb9aQiHzQm/njgO1WMCvVdF9GZ.MBKJulK5SLauBQma6eO','resident','085179629110',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:58','2026-06-10 21:59:20'),(5,'Andhi Listanto','0895621362349@kospart.com',NULL,'$2y$12$qxjZDMypLYteYtoz6RUI/OWYd7gVI/5yN3X.rfpCgOk5QPdqwU2Jm','resident','0895621362349',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:58','2026-06-10 21:59:20'),(6,'Hanny','089630411546@kospart.com',NULL,'$2y$12$uYddbJs.0WSOzYeDIJpmqu6erRSI0VvjDTw6n5kn5dCBwo0WRsake','resident','089630411546',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(7,'Tante Che','081316713800@kospart.com',NULL,'$2y$12$Li.F1HWbVAQ8l/zVOhZS1Oc6/At8hO6c23AHyhD6S50V5UZ0yZDz.','resident','081316713800',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(8,'Dinda / Aurel','085896226379@kospart.com',NULL,'$2y$12$VzayoS5WCyDepgLX6OOYDe3NmfyX8VyP19LBlV2v6xEJzDDPtiaJW','resident','085896226379',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(9,'Migos','081374605884@kospart.com',NULL,'$2y$12$kMBZYnr1hyATxm/qVGf1Me6JzIob3AiYd9C413Gi5Yi7vT2g5aZ62','resident','081374605884',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(10,'Melinda','081391156418@kospart.com',NULL,'$2y$12$SnGyxNFUdA/E5M6IcI4arOeMppQ0HqD8bLUUXzDxOOzDFzG56ixfm','resident','081391156418',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(11,'Hanafi','0895404897735@kospart.com',NULL,'$2y$12$sY7E5XsjHM9S850g9WSBKeCxvCmG6TOyLhSVTVxG5j43c4aEYChIK','resident','0895404897735',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:21:59','2026-06-10 21:59:20'),(12,'Zahra','083128533761@kospart.com',NULL,'$2y$12$8RJNOnw4kirSplU/nPnYI.n8guU7rnMt/p8PKEk6HI/q0xu1RlqGm','resident','083128533761',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:00','2026-06-16 20:50:59'),(13,'Novia','085805355107@kospart.com',NULL,'$2y$12$eiV4a2.HKRXvNma1n5v3AuTmMMkCYjkxeXIeEwH8jf9Eqyo67b9AO','resident','085805355107',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:00','2026-06-10 21:59:20'),(14,'Dendy','085383831663@kospart.com',NULL,'$2y$12$SW.wKbC1dbBF.MJRWMeHP.AAD7CINuXjzEG/F1FTgbYnDD8Og37ui','resident','085383831663',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:00','2026-06-10 21:59:20'),(15,'Citania','0895359627866@kospart.com',NULL,'$2y$12$GxLNzTOFJYLSkk8h78gSQ.QnicbrJXSH.ZmlQj5LXtJvqm8o2tyEm','resident','0895359627866',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:00','2026-06-10 21:59:20'),(16,'Ibu Amelia','081278631726@kospart.com',NULL,'$2y$12$NBH/TJfZtgeR3Pim1F864uuay35BOPCM2O8JDC9G111dec70s98Xq','resident','081278631726',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:00','2026-06-10 21:59:20'),(17,'M. Kairi','081938017820@kospart.com',NULL,'$2y$12$y84Et5riVugBNfwRuq.rxeWjQfmpaD69IuRFrRbuXozzqGT8lTFeu','resident','081938017820',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:01','2026-06-10 21:59:20'),(18,'Jihan','08961106@kospart.com',NULL,'$2y$12$WMhzM8GNUrxKtOiUkk0pOOetLkhnQPCnGAlqNm4cW7qi4GtD0hsLC','resident','089611062816',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:01','2026-06-15 02:54:46'),(19,'Devika','08889023273@kospart.com',NULL,'$2y$12$xIkjkx4K5Fsk9PMOtHhVvetvI594IX5v6wWQKjDlJp4fgCNB6rxvC','resident','08889023273',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:01','2026-06-10 21:59:20'),(20,'Andin','083117367463@kospart.com',NULL,'$2y$12$Ww2FMYD3V9oF0MlEXBVHiOTrvl8pKywYV0UAVjNdMZbemjr868i3i','resident','083117367463',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:01','2026-06-10 21:59:20'),(21,'Chinta Calista','087751714884@kospart.com',NULL,'$2y$12$YSwK7sRcgsQ5nVUnsopkAOIu7IwrYgw6b0gJbh2ozB.6rl0fwdVMa','resident','087751714884',NULL,NULL,NULL,NULL,NULL,'2026-06-10 21:22:01','2026-06-10 21:59:20'),(22,'muhamad rifqi al ardabili','muhamadrifqialardabili@gmail.com',NULL,'$2y$12$fPy4youFvejbfyFyH1253.jyiaxnLhlpKO6O6xjpMHVmqdr7vQvni','resident','082181473475','1871070405040001','ktp/1781335834_ktp_cBXdocC9E3.png',NULL,NULL,'DvwnvIdZwL9otqX9SXjxfei9ufyLOaVnAnfZOajhkvWZGlwSDDe8g75KDTRa','2026-06-11 00:07:25','2026-06-17 19:13:56'),(23,'juheri','operator@gmail.com',NULL,'$2y$12$Gg9EXW4tTR1TGNxoRbKC..SGiYkJN.KJxScg11gucAa5dhEw30UPy','operator','08982350747',NULL,NULL,NULL,'[\"1\"]',NULL,'2026-06-11 01:46:57','2026-06-18 23:23:24'),(24,'Karyawan-utama','karyawanutama@kospart.com',NULL,'$2y$12$Iv2gVvfq8JoAA4nWJu20huMvFzhOWAouioy.oCQNKr1d7VlfWmrfO','karyawan',NULL,NULL,NULL,NULL,'[\"1\"]',NULL,'2026-06-13 01:10:26','2026-06-13 01:10:26'),(26,'HANNA AGUSTYA PERMATASARI','hanna123@gmail.com',NULL,'$2y$12$mBitV2Y0XgEC8QkkBZVIJegXtP4ymig9Fi7jVaquaYucieGrXKbiG','resident','08562559675','3404015008990003','ktp/1781436597_manual_ktp_8AlYsAlpPe.png',NULL,NULL,NULL,'2026-06-14 04:29:59','2026-06-14 04:29:59'),(28,'test','test@gmail.com',NULL,'$2y$12$iSbCmKAwH1ax3hYLV.VhyO3bWqCMYJBo913xoMqLrsj9Vmyrq09gi','resident','089528306239','1234567890123456',NULL,NULL,NULL,NULL,'2026-06-22 01:22:02','2026-06-23 23:19:25');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `virtual_tours`
--

DROP TABLE IF EXISTS `virtual_tours`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `virtual_tours` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `order` int NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `virtual_tours`
--

LOCK TABLES `virtual_tours` WRITE;
/*!40000 ALTER TABLE `virtual_tours` DISABLE KEYS */;
INSERT INTO `virtual_tours` VALUES (1,'Resepsionis','/storage/virtual_tours/o13tJ1n6D0ByV1MvDnSGcStTgegNT0Y0Yhk2k9A8.mp4',0,1,'2026-06-14 20:19:30','2026-06-14 20:21:08'),(2,'Kamar Mandi Dalam','/storage/virtual_tours/i7ZA0fJL0GuKkjJGCRglVXtfwaUli94K6Cg5k7LZ.mp4',1,1,'2026-06-14 20:21:36','2026-06-14 20:21:36'),(3,'Suasana Dalam Kamar','/storage/virtual_tours/FqHx8HwqWYBXJrGN1ERDVxYTFxh7ealTtKTCgh8o.mp4',2,1,'2026-06-14 20:22:05','2026-06-14 20:22:05');
/*!40000 ALTER TABLE `virtual_tours` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-30 12:18:51
