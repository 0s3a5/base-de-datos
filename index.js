const express = require('express');
const path = require('path');
const cors = require('cors');
const { neon } = require('@neondatabase/serverless');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const sql = neon(
  'postgresql://neondb_owner:vwef0YrDuE7Q@ep-wispy-flower-a5yxd7dk.us-east-2.aws.neon.tech/neondb?sslmode=require'
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/consultas/gym-mas-dinero', async (req, res) => {
  const query = `
    SELECT id_local, dinero AS dinero_generado 
    FROM Informacion_Financiera 
    ORDER BY dinero DESC LIMIT 1;
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/maquina-mas-uso', async (req, res) => {
  const query = `
    SELECT id_maquina, COUNT(*) AS cantidad_uso 
    FROM Seguridad_Acceso 
    JOIN Maq_Locales ON Seguridad_Acceso.id_local = Maq_Locales.id_local 
    GROUP BY id_maquina 
    ORDER BY cantidad_uso DESC LIMIT 1;
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/mas-tiempo', async (req, res) => {
  const query = `
  SELECT rut_persona_entra, fecha, SUM(EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600) AS horas_totales
  FROM Seguridad_Acceso
  GROUP BY rut_persona_entra, fecha
  HAVING  SUM(EXTRACT(EPOCH FROM (hora_salida - hora_entrada)) / 3600) > 2;
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/membresia-usuario', async (req, res) => {
  const { rut } = req.query; // Rut como parámetro de consulta
  const query = `
    SELECT Usuarios.rut, Usuarios.nombre, Membresias.id_membresia 
    FROM Usuarios 
    JOIN Membresias ON Usuarios.rut = Membresias.rut_usuario 
    WHERE Usuarios.rut = $1;
  `;
  try {
    const result = await sql(query, [rut]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/local-usuario', async (req, res) => {
  const { rut } = req.query; // Rut como parámetro de consulta
  const query = `
    SELECT Locales.id_local, Locales.direccion, Locales.ciudad 
    FROM Usuarios 
    JOIN Seguridad_Acceso ON Usuarios.rut = Seguridad_Acceso.rut_persona_entra 
    JOIN Locales ON Seguridad_Acceso.id_local = Locales.id_local 
    WHERE Usuarios.rut = $1;
  `;
  try {
    const result = await sql(query, [rut]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/gyms-valparaiso', async (req, res) => {
  const query = `
    SELECT * 
    FROM Locales 
    WHERE ciudad = 'Valparaíso';
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/diciembre', async (req, res) => {
  const query = `
  SELECT DISTINCT rut_persona_entra
  FROM Seguridad_Acceso
  WHERE id_local = 3
  AND fecha BETWEEN '2023-09-01' AND '2023-12-31';
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/usuarios-clase', async (req, res) => {
  const { id_clase } = req.query; // ID de la clase como parámetro de consulta
  const query = `
    SELECT COUNT(UA.rut) AS cantidad_usuarios 
    FROM Us_Act UA 
    JOIN Clases_Actividades CA ON UA.id_clase = CA.id_clase 
    WHERE CA.id_clase = $1;
  `;
  try {
    const result = await sql(query, [id_clase]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/usuarios-gym', async (req, res) => {
  const { id_local } = req.query; // ID del gym como parámetro de consulta
  const query = `
    SELECT DISTINCT rut_persona_entra 
    FROM Seguridad_Acceso 
    WHERE id_local = $1 
    AND fecha BETWEEN '2023-09-01' AND '2023-12-31';
  `;
  try {
    const result = await sql(query, [id_local]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/trabajadores-clases-gym', async (req, res) => {
  const query = `SELECT * FROM TrabajadoresYClasesPorGym();`;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/gyms-fuera-santiago', async (req, res) => {
  const query = `SELECT *
  FROM Locales
  WHERE ciudad <> 'Santiago';
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/salario-trabajador', async (req, res) => {
  const { rut_personal } = req.query;
  const query = `SELECT * FROM SalarioDeTrabajador($1);`;
  try {
    const result = await sql(query, [rut_personal]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/usuarios-estancia-larga', async (req, res) => {
  const query = `SELECT COUNT(DISTINCT fecha) AS dias_asistidos
  FROM Seguridad_Acceso
  WHERE rut_persona_entra = '12345678-9';
  `;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});

app.get('/consultas/dias-asistidos', async (req, res) => {
  const { rut_usuario } = req.query;
  const query = `SELECT * FROM DiasAsistidos($1);`;
  try {
    const result = await sql(query, [rut_usuario]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/usuarios-en-gym', async (req, res) => {
  const { id_local, fecha_inicio, fecha_fin } = req.query;
  const query = `SELECT * FROM UsuariosEnGymEntreFechas($1, $2, $3);`;
  try {
    const result = await sql(query, [id_local, fecha_inicio, fecha_fin]);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/membresia-mas-cara', async (req, res) => {
  const query = `SELECT * FROM MembresiaMasCara();`;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
app.get('/consultas/cursos-por-gym', async (req, res) => {
  const query = `SELECT L.id_local, L.direccion, L.ciudad, CA.id_clase, CA.fecha
  FROM Locales L
  JOIN Clases_Actividades CA ON L.id_local = CA.id_local;`;
  try {
    const result = await sql(query);
    res.json(result);
  } catch (error) {
    res.status(500).send(`Error en la consulta: ${error.message}`);
  }
});
