-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-03-2026 a las 19:07:12
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `anatomia_db`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `organos_imagenes`
--

CREATE TABLE `organos_imagenes` (
  `id` int(11) NOT NULL,
  `id_svg` varchar(50) NOT NULL,
  `url_imagen` varchar(255) NOT NULL,
  `descripcion_imagen` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `organos_imagenes`
--

INSERT INTO `organos_imagenes` (`id`, `id_svg`, `url_imagen`, `descripcion_imagen`) VALUES
(1, 'SR_Nariz', '/img/nariz_interna.jpg', 'Interna'),
(2, 'SD_Estomago', '/img/estomago_interior.jpg', 'Capas musculares internas'),
(3, 'SD_Estomago', '/img/estomago_microscopio.jpg', 'Tejido gástrico'),
(9, 'SO_Craneo', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773353306/anatomia_web/archivo-1773353412118.jpg', 'Galería de Craneo'),
(12, 'SO_VertebrasTor', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773354439/anatomia_web/archivo-1773354546463.jpg', 'Galería de Vértebras Torácicas'),
(18, 'SO_Esternon', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773502541/anatomia_web/archivo-1773502648917.jpg', 'Galería de Esternón'),
(19, 'SO_Costilla', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773502638/anatomia_web/archivo-1773502745788.webp', 'Galería de Costilla'),
(20, 'SO_Humero', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773502769/anatomia_web/archivo-1773502876661.jpg', 'Galería de Húmero'),
(21, 'SO_Sacro', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773502869/anatomia_web/archivo-1773502976812.jpg', 'Galería de Sacro'),
(22, 'SO_Coccix', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773502946/anatomia_web/archivo-1773503053611.jpg', 'Galería de Cóccix'),
(23, 'SO_Cubito', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503018/anatomia_web/archivo-1773503125957.jpg', 'Galería de Cúbito'),
(24, 'SO_Radio', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503099/anatomia_web/archivo-1773503206345.jpg', 'Galería de Radio'),
(25, 'SO_Pelvis', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503210/anatomia_web/archivo-1773503317761.jpg', 'Galería de Pelvis'),
(26, 'SO_Carpos', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503284/anatomia_web/archivo-1773503392218.jpg', 'Galería de Carpos'),
(27, 'SO_Metacarpos', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503359/anatomia_web/archivo-1773503466832.jpg', 'Galería de Metacarpos'),
(29, 'SO_Femur', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503512/anatomia_web/archivo-1773503619693.jpg', 'Galería de Fémur'),
(31, 'SO_Rotula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503691/anatomia_web/archivo-1773503798571.jpg', 'Galería de Rótula'),
(32, 'SO_Tibia', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503783/anatomia_web/archivo-1773503891278.jpg', 'Galería de Tibia'),
(33, 'SO_Perone', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503910/anatomia_web/archivo-1773504017877.jpg', 'Galería de Peroné'),
(34, 'SO_Tarsos', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773503989/anatomia_web/archivo-1773504097040.jpg', 'Galería de Tarsos'),
(35, 'SO_Metatarsos', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504143/anatomia_web/archivo-1773504251281.webp', 'Galería de Metatarsos'),
(36, 'SO_Falanges', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504261/anatomia_web/archivo-1773504368964.jpg', 'Galería de Falanges'),
(37, 'SD_Boca', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504751/anatomia_web/archivo-1773504858943.jpg', 'Galería de Boca'),
(38, 'SD_Paladar', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504803/anatomia_web/archivo-1773504911013.jpg', 'Galería de Paladar'),
(39, 'SD_Uvula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504875/anatomia_web/archivo-1773504982735.jpg', 'Galería de Úvula'),
(40, 'SD_Lengua', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773504939/anatomia_web/archivo-1773505046754.jpg', 'Galería de Lengua'),
(41, 'SD_Diente', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773505112/anatomia_web/archivo-1773505220284.jpg', 'Galería de Diente'),
(43, 'SO_Escapula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773507589/anatomia_web/archivo-1773507696643.jpg', 'Galería de Escápula'),
(44, 'SO_Manubrio', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773507850/anatomia_web/archivo-1773507957929.jpg', 'Galería de Manubrio'),
(45, 'SO_Clavicula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773507892/anatomia_web/archivo-1773508000272.jpg', 'Galería de Clavícula'),
(46, 'SO_VertebrasLum', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773507988/anatomia_web/archivo-1773508096118.jpg', 'Galería de Vértebras Lumbares'),
(47, 'SO_Mandibula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508056/anatomia_web/archivo-1773508163679.jpg', 'Galería de Mandibula'),
(48, 'SO_VertebrasCer', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508132/anatomia_web/archivo-1773508239702.jpg', 'Galería de Vértebras Cervicales'),
(49, 'SO_Columna', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508213/anatomia_web/archivo-1773508321521.jpg', 'Galería de Columna Vertebral'),
(50, 'SD_Faringe', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508374/anatomia_web/archivo-1773508482347.jpg', 'Galería de Faringe'),
(51, 'SD_Esofago', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508449/anatomia_web/archivo-1773508556721.jpg', 'Galería de Esófago'),
(52, 'SD_Glandulas', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508535/anatomia_web/archivo-1773508643082.jpg', 'Galería de Glándulas Salivales'),
(53, 'SD_Sublingual', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508590/anatomia_web/archivo-1773508698047.jpg', 'Galería de Sublingual'),
(54, 'SD_Submaxilar', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508661/anatomia_web/archivo-1773508769113.jpg', 'Galería de Submaxilar'),
(55, 'SD_Parotida', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508836/anatomia_web/archivo-1773508944334.jpg', 'Galería de Parótida'),
(56, 'SD_Higado', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508874/anatomia_web/archivo-1773508981851.jpg', 'Galería de Higado'),
(57, 'SD_Vesicula', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773508938/anatomia_web/archivo-1773509046026.jpg', 'Galería de Vesícula Biliar'),
(58, 'SD_ConductoBi', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509128/anatomia_web/archivo-1773509235825.webp', 'Galería de Conducto Biliar Común'),
(59, 'SD_IntestinoDel', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509369/anatomia_web/archivo-1773509477521.jpg', 'Galería de Intestino Delgado'),
(60, 'SD_Duodeno', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509414/anatomia_web/archivo-1773509521767.jpg', 'Galería de Duodeno'),
(61, 'SD_Yeyuno', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509454/anatomia_web/archivo-1773509561610.jpg', 'Galería de Yeyuno'),
(62, 'SD_Ileon', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509490/anatomia_web/archivo-1773509597791.jpg', 'Galería de Íleon'),
(63, 'SD_Apendice', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509562/anatomia_web/archivo-1773509670471.webp', 'Galería de Apéndice'),
(64, 'SD_Ano', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509644/anatomia_web/archivo-1773509752208.jpg', 'Galería de Ano'),
(65, 'SD_Pancreas', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509737/anatomia_web/archivo-1773509844855.jpg', 'Galería de Páncreas'),
(66, 'SD_ConductoPa', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773509956/anatomia_web/archivo-1773510063976.jpg', 'Galería de Conducto Pancreático'),
(67, 'SD_IntestinoGrue', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510018/anatomia_web/archivo-1773510126075.jpg', 'Galería de Intestino Grueso'),
(68, 'SD_ColonTrans', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510168/anatomia_web/archivo-1773510276483.jpg', 'Galería de Colon Transverso'),
(69, 'SD_ColonAsc', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510266/anatomia_web/archivo-1773510373547.jpg', 'Galería de Colon Ascendente'),
(70, 'SD_Ciego', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510453/anatomia_web/archivo-1773510561243.jpg', 'Galería de Ciego'),
(71, 'SD_ColonDesc', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510505/anatomia_web/archivo-1773510613111.jpg', 'Galería de Colon Descendente'),
(72, 'SD_Sigma', 'https://res.cloudinary.com/dbdeldijt/image/upload/v1773510601/anatomia_web/archivo-1773510709469.jpg', 'Galería de Sigma');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `organos_imagenes`
--
ALTER TABLE `organos_imagenes`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `organos_imagenes`
--
ALTER TABLE `organos_imagenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
