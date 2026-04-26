[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/JMUAIOxt)


Comando levantar server MongoDB:
sudo /home/usuario/mongodb/bin/mongod --dbpath /home/usuario/mongodb-data/

# Flujo diario: Empezar a trabajar

Importante: Hacer esto siempre antes de tocar el código para asegurar de que tienes lo último que han hecho los demás

## 1. Asegúrate de estar en main
git checkout main

## 2. Descarga lo nuevo que haya en GitHub
git pull origin main

## 3. Crea/entra a tu rama para la tarea (ejemplo: pacientes)
git checkout -b feat/patient-crud

# Durante el trabajo: Guardar el progreso

No esperes a terminar todo para guardar. Hazlo por partes (ejemplo: después de hacer el modelo, después de la primera ruta...).

## 1. Mira qué archivos has cambiado
git status

## 2. Prepara los archivos para el "guardado"
git add .

## 3. Guarda con un mensaje descriptivo
git commit -m "feat: implementado esquema de pacientes y validaciones"

Finalizar: Subir a GitHub y Pull Request

Cuando ya has terminado los 7 manejadores de tu ruta y los has probado:
Bash

# 1. Sube tu rama a la nube
git push origin feat/patient-crud

## Ahora toca ir a la web de GitHub:

    Verás un aviso amarillo: "Compare & pull request". Haz clic ahí.

    Escribe un título breve y, en la descripción, menciona qué has hecho.

    A la derecha, en Reviewers, elige a uno de tus compañeros para que revise.

    Dale a "Create pull request".

5. Después del Merge: Limpieza

Cuando tu compañero(o tu si no pueden los demas) apruebe el PR y se haga el Merge en la web:

## 1. Vuelve a tu rama principal
git checkout main

## 2. Bájate tu propio trabajo ya fusionado (y el de los demás)
git pull origin main