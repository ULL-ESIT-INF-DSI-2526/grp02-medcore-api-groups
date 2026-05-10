# MedCore API - Grupo S

Esta es la API para el sistema **MedCore**, diseñada para gestionar pacientes, personal sanitario, medicamentos e historiales clínicos. El proyecto está desarrollado con **Node.js**, **Express**, **TypeScript**, usa base de datos **MongoDB**, desplegado en **Render**.

## 🔗 Despliegue y Documentación

* **API:** [https://grp02-medcore-api-groups.onrender.com](https://grp02-medcore-api-groups.onrender.com)
* **Documentación API:** [https://grp02-medcore-api-groups.onrender.com/api-docs](https://grp02-medcore-api-groups.onrender.com/api-docs)

## 🛠️ Instalación y Ejecución en Local

1. **Clonar el repositorio:**
```bash
git clone https://github.com/ULL-ESIT-INF-DSI-2526/grp02-medcore-api-groups.git
cd grp02-medcore-api-groups

```


2. **Instalar dependencias:**
```bash
npm install
```

Nota sobre seguridad: Por motivos estrictamente académicos y para facilitar la corrección y el despliegue rápido, se han incluido las variables de entorno en el repositorio. En un entorno de producción real, el archivo .env estaría incluido en el .gitignore y las credenciales se gestionarían de forma segura (ej. Secretos de GitHub o variables de entorno del servidor como hemos hecho con mongo y render), en caso real debería hacerse el paso 3 descrito a continuación

3. **Variables de entorno:**
Crea un archivo `.env` con lo siguiente:
```env
MONGODB_URL=mongodb://tu_url_de_atlas_aqui/medcore-api
PORT=3000

```


4. **Compilar y Ejecutar:**
```bash
npm run build  
npm start      

```

5. **Ejecutar mongo localmente:**
```bash
sudo /home/usuario/mongodb/bin/mongod --dbpath /home/usuario/mongodb-data/

```



## 🧪 Pruebas y Cubrimiento

Hemos implementado un conjunto de pruebas de integración que cubre las validaciones de los modelos y las respuestas de las rutas.

```bash
npm test   
npm run coverage

```
