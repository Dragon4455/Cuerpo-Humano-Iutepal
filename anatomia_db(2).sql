-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 27-02-2026 a las 03:19:37
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
(3, 'SD_Estomago', '/img/estomago_microscopio.jpg', 'Tejido gástrico');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sistema_digestivo`
--

CREATE TABLE `sistema_digestivo` (
  `id` int(11) NOT NULL,
  `id_svg` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `iframe_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sistema_digestivo`
--

INSERT INTO `sistema_digestivo` (`id`, `id_svg`, `nombre`, `descripcion`, `fecha_actualizacion`, `iframe_url`) VALUES
(1, 'SD_Faringe', 'Faringe', 'Conducto de paredes musculosas y membranosas que comunica la boca con el esófago.', '2026-02-19 23:08:34', NULL),
(2, 'SD_Lengua', 'Lengua', 'Órgano muscular situado en el suelo de la boca que sirve para gustar y deglutir.', '2026-02-19 23:08:34', NULL),
(3, 'SD_Diente', 'Diente', 'Cuerpo duro que nace en las encías y sirve para masticar los alimentos.', '2026-02-19 23:08:34', NULL),
(4, 'SD_Boca', 'Boca', 'Puerta de entrada donde comienza la digestión mecánica (masticación).', '2026-02-19 23:20:23', NULL),
(6, 'SD_Paladar', 'Paladar', 'Techo de la boca que separa la cavidad bucal de la nasal.', '2026-02-19 23:22:57', NULL),
(7, 'SD_Uvula', 'Úvula', 'Pequeño tejido que ayuda a evitar que la comida suba a la nariz al tragar.', '2026-02-19 23:22:57', NULL),
(8, 'SD_Esofago', 'Esófago', 'Tubo muscular que transporta el bolo alimenticio hacia el estómago mediante movimientos rítmicos.', '2026-02-19 23:24:22', NULL),
(9, 'SD_Estomago', 'Estómago', 'Bolsa muscular que mezcla la comida con ácidos gástricos para descomponerla.', '2026-02-19 23:32:52', NULL),
(10, 'SD_Pancreas', 'Páncreas', 'Produce enzimas digestivas y hormonas como la insulina.', '2026-02-19 23:32:52', NULL),
(11, 'SD_ConductoPa', 'Conducto Pancreático', 'Lleva los jugos pancreáticos al duodeno.', '2026-02-19 23:35:57', NULL),
(12, 'SD_IntestinoGrue', 'Intestino Grueso', 'Absorbe agua y sales minerales de lo que no se digirió, transformando los restos líquidos en heces sólidas.', '2026-02-19 23:51:59', NULL),
(13, 'SD_ColonTrans', 'Colon Transverso', 'A medida que el material avanza por estos tramos, el cuerpo reabsorbe agua y electrolitos. Lo que queda se convierte en materia fecal sólida.', '2026-02-19 23:39:11', NULL),
(14, 'SD_ColonAsc', 'Colon Ascendente', 'A medida que el material avanza por estos tramos, el cuerpo reabsorbe agua y electrolitos. Lo que queda se convierte en materia fecal sólida.', '2026-02-19 23:40:31', NULL),
(15, 'SD_ColonDesc', 'Colon Descendente', 'A medida que el material avanza por estos tramos, el cuerpo reabsorbe agua y electrolitos. Lo que queda se convierte en materia fecal sólida.', '2026-02-19 23:40:31', NULL),
(16, 'SD_Ciego', 'Ciego', 'Bolsa que conecta el intestino delgado con el grueso.', '2026-02-19 23:43:04', NULL),
(17, 'SD_Sigma', 'Sigma', 'Absorbe agua y sales de los residuos, formando las heces.', '2026-02-19 23:43:04', NULL),
(18, 'SD_Recto', 'Recto', 'Almacena las heces antes de ser expulsadas.', '2026-02-19 23:44:09', NULL),
(19, 'SD_Ano', 'Ano', 'Abertura final por donde se eliminan los desechos sólidos.', '2026-02-19 23:44:09', NULL),
(20, 'SD_Apendice', 'Apéndice', 'Pequeño órgano con funciones inmunitarias (aunque a veces se inflama).', '2026-02-19 23:48:18', NULL),
(21, 'SD_Ileon', 'Íleon', 'Parte final que absorbe vitaminas específicas y sales biliares.', '2026-02-19 23:48:18', NULL),
(22, 'SD_Yeyuno', 'Yeyuno', 'Zona media donde ocurre la mayor parte de la absorción de nutrientes.', '2026-02-19 23:49:16', NULL),
(23, 'SD_Duodeno', 'Duodeno', 'Primera parte donde se mezcla el alimento con la bilis y enzimas.', '2026-02-19 23:49:16', NULL),
(24, 'SD_IntestinoDel', 'Intestino Delgado', 'Descompone los alimentos (con ayuda de la bilis y enzimas) y absorbe los nutrientes (proteínas, grasas y azúcares) para pasarlos a la sangre.', '2026-02-19 23:51:21', NULL),
(25, 'SD_ConductoBi', 'Conducto Biliar Común', 'Transporta la bilis desde el hígado y vesícula hasta el intestino delgado.', '2026-02-19 23:51:21', NULL),
(26, 'SD_Vesicula', 'Vesícula Biliar', 'Almacena la bilis hasta que el cuerpo la necesita para digerir grasas.', '2026-02-19 23:54:24', NULL),
(27, 'SD_Higado', 'Higado', 'Produce bilis, procesa nutrientes y desintoxica el cuerpo.', '2026-02-19 23:54:24', NULL),
(28, 'SD_Parotida', 'Parótida', 'Es la glándula de mayor tamaño y se sitúa frente a las orejas.', '2026-02-19 23:57:01', NULL),
(29, 'SD_Submaxilar', 'Submaxilar', 'Se localiza debajo de la base de la mandíbula.', '2026-02-19 23:57:01', NULL),
(30, 'SD_Sublingual', 'Sublingual', 'Es la más pequeña y se encuentra situada bajo la lengua.', '2026-02-19 23:57:36', NULL),
(31, 'SD_Glandulas', 'Glándulas Salivales', 'Producen la saliva necesaria para humedecer los alimentos e iniciar la digestión química. Se dividen en tres pares principales.', '2026-02-19 23:58:20', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sistema_respiratorio`
--

CREATE TABLE `sistema_respiratorio` (
  `id` int(11) NOT NULL,
  `id_svg` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha_actualizacion` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `iframe_url` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `sistema_respiratorio`
--

INSERT INTO `sistema_respiratorio` (`id`, `id_svg`, `nombre`, `descripcion`, `fecha_actualizacion`, `iframe_url`) VALUES
(1, 'SR_Nariz', 'Nariz', 'Es la entrada principal del aire al sistema respiratorio.', '2026-02-26 23:58:52', NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `organos_imagenes`
--
ALTER TABLE `organos_imagenes`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sistema_digestivo`
--
ALTER TABLE `sistema_digestivo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_svg` (`id_svg`);

--
-- Indices de la tabla `sistema_respiratorio`
--
ALTER TABLE `sistema_respiratorio`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `id_svg` (`id_svg`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `organos_imagenes`
--
ALTER TABLE `organos_imagenes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `sistema_digestivo`
--
ALTER TABLE `sistema_digestivo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de la tabla `sistema_respiratorio`
--
ALTER TABLE `sistema_respiratorio`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
