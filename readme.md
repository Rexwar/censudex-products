# 📦 Censudex Products Service

Microservicio de gestión de productos para la plataforma Censudex, implementado con gRPC, MongoDB y Cloudinary.

## 👥 Equipo de Desarrollo

- **Nombre Completo 1** - RUT: XX.XXX.XXX-X
- **Nombre Completo 2** - RUT: XX.XXX.XXX-X
- **Nombre Completo 3** - RUT: XX.XXX.XXX-X
- **Nombre Completo 4** - RUT: XX.XXX.XXX-X *(opcional)*

## 📋 Índice

- [Descripción](#descripción)
- [Arquitectura](#arquitectura)
- [Tecnologías](#tecnologías)
- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [Endpoints gRPC](#endpoints-grpc)
- [Pruebas](#pruebas)
- [Estructura del Proyecto](#estructura-del-proyecto)

## 📖 Descripción

El **Products Service** es un microservicio independiente responsable de gestionar toda la información de los productos en el sistema Censudex. Permite realizar operaciones CRUD (Crear, Leer, Actualizar, Eliminar) sobre los productos, utilizando MongoDB como base de datos y Cloudinary para el almacenamiento de imágenes.

### Características Principales

- ✅ Creación de productos con validación completa
- ✅ Consulta de productos con filtros (categoría, estado, búsqueda)
- ✅ Actualización de productos incluyendo imágenes
- ✅ Eliminación lógica (soft delete) de productos
- ✅ Gestión de imágenes con Cloudinary
- ✅ Validación robusta de datos
- ✅ Identificadores únicos UUID v4
- ✅ Comunicación mediante gRPC

## 🏗️ Arquitectura

### Patrón de Diseño

Este microservicio implementa el **Patrón de Arquitectura en Capas** (Layered Architecture):

1. **Capa de Presentación (gRPC)**: Maneja las solicitudes y respuestas gRPC
2. **Capa de Servicios**: Contiene la lógica de negocio
3. **Capa de Acceso a Datos**: Gestiona las operaciones con MongoDB
4. **Capa de Modelos**: Define las estructuras de datos

### Arquitectura de Microservicios

```
┌─────────────────────┐
│   API Gateway       │
│   (HTTP/gRPC)       │
└──────────┬──────────┘
           │ gRPC
           ▼
┌─────────────────────┐
│ Products Service    │
│   (gRPC Server)     │
├─────────────────────┤
│  - Product Logic    │
│  - Validation       │
│  - Image Upload     │
└──────────┬──────────┘
           │
      ┌────┴────┐
      ▼         ▼
┌──────────┐ ┌──────────┐
│ MongoDB  │ │Cloudinary│
└──────────┘ └──────────┘
```

## 🛠️ Tecnologías

- **Node.js** v18+
- **gRPC** (@grpc/grpc-js)
- **MongoDB** 6.0+
- **Cloudinary** (almacenamiento de imágenes)
- **Protocol Buffers** (definición de servicios)
- **UUID** v4 (identificadores únicos)
- **dotenv** (variables de entorno)

## 📦 Requisitos Previos

Antes de comenzar, asegúrate de tener instalado:

1. **Node.js** (v18 o superior)
   ```bash
   node --version
   ```

2. **MongoDB** (v6.0 o superior)
   ```bash
   mongod --version
   ```

3. **npm** o **yarn**
   ```bash
   npm --version
   ```

4. **Cuenta de Cloudinary** (gratuita)
   - Regístrate en [cloudinary.com](https://cloudinary.com/)
   - Obtén tus credenciales (Cloud Name, API Key, API Secret)

## 🚀 Instalación

### Paso 1: Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/censudex-products.git
cd censudex-products
```

### Paso 2: Instalar Dependencias

```bash
npm install
```

### Paso 3: Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/censudex_products
MONGODB_DB_NAME=censudex_products

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret

# gRPC Configuration
GRPC_PORT=50052

# Environment
NODE_ENV=development
```

### Paso 4: Iniciar MongoDB

```bash
# En Windows
net start MongoDB

# En macOS/Linux
sudo systemctl start mongodb
# o
sudo service mongodb start
```

### Paso 5: Poblar la Base de Datos (Opcional)

```bash
npm run seed
```

Este comando insertará 10 productos de ejemplo en la base de datos.

## ▶️ Uso

### Iniciar el Servidor

#### Modo Desarrollo (con reinicio automático)

```bash
npm run dev
```

#### Modo Producción

```bash
npm start
```

Deberías ver una salida similar a:

```
🚀 Iniciando servidor gRPC de Products Service...
✅ Conectado exitosamente a MongoDB
📊 Base de datos: censudex_products
✅ Índices creados correctamente
✅ Conexión con Cloudinary establecida
✅ Servidor gRPC iniciado correctamente
📡 Escuchando en 0.0.0.0:50052
🌐 Entorno: development
📦 Servicios disponibles:
   - CreateProduct
   - GetProducts
   - GetProductById
   - UpdateProduct
   - DeleteProduct
```

## 📡 Endpoints gRPC

### 1. CreateProduct

Crea un nuevo producto en el sistema.

**Request:**
```protobuf
message CreateProductRequest {
  string name = 1;           // Nombre del producto (min: 3 chars)
  string description = 2;     // Descripción (min: 10 chars)
  double price = 3;          // Precio (> 0)
  string category = 4;        // Categoría
  bytes image = 5;           // Imagen en bytes
  string imageFileName = 6;   // Nombre del archivo
  string adminId = 7;        // UUID del administrador
}
```

**Response:**
```protobuf
message ProductResponse {
  bool success = 1;
  string message = 2;
  Product product = 3;
}
```

**Validaciones:**
- Nombre único (no pueden existir dos productos con el mismo nombre)
- Nombre: mínimo 3 caracteres, máximo 100
- Descripción: mínimo 10 caracteres, máximo 1000
- Precio: número positivo, máximo 9,999,999.99
- Categoría: mínimo 3 caracteres, máximo 50
- Imagen: máximo 5MB, formatos permitidos: jpg, jpeg, png, webp, gif
- AdminId: UUID v4 válido

### 2. GetProducts

Obtiene la lista de productos con filtros opcionales.

**Request:**
```protobuf
message GetProductsRequest {
  optional string category = 1;    // Filtrar por categoría
  optional bool isActive = 2;      // Filtrar por estado
  optional string searchName = 3;  // Buscar por nombre
}
```

**Response:**
```protobuf
message ProductsListResponse {
  bool success = 1;
  string message = 2;
  repeated Product products = 3;
  int32 total = 4;
}
```

**Ejemplos de Filtros:**
- Todos los productos: `{}`
- Por categoría: `{ category: "Electrónica" }`
- Solo activos: `{ isActive: true }`
- Búsqueda: `{ searchName: "laptop" }`
- Combinado: `{ category: "Electrónica", isActive: true }`

### 3. GetProductById

Obtiene un producto específico por su ID.

**Request:**
```protobuf
message GetProductByIdRequest {
  string id = 1;  // UUID del producto
}
```

**Response:**
```protobuf
message ProductResponse {
  bool success = 1;
  string message = 2;
  Product product = 3;
}
```

### 4. UpdateProduct

Actualiza un producto existente.

**Request:**
```protobuf
message UpdateProductRequest {
  string id = 1;                   // UUID del producto
  optional string name = 2;         // Nuevo nombre
  optional string description = 3;  // Nueva descripción
  optional double price = 4;        // Nuevo precio
  optional string category = 5;     // Nueva categoría
  optional bytes image = 6;         // Nueva imagen
  optional string imageFileName = 7;
  string adminId = 8;              // UUID del administrador
}
```

**Response:**
```protobuf
message ProductResponse {
  bool success = 1;
  string message = 2;
  Product product = 3;
}
```

**Notas:**
- Solo se actualizan los campos proporcionados
- Si se proporciona una nueva imagen, la anterior se elimina de Cloudinary
- Las validaciones son las mismas que en CreateProduct

### 5. DeleteProduct

Elimina un producto (soft delete - marca como inactivo).

**Request:**
```protobuf
message DeleteProductRequest {
  string id = 1;       // UUID del producto
  string adminId = 2;  // UUID del administrador
}
```

**Response:**
```protobuf
message DeleteProductResponse {
  bool success = 1;
  string message = 2;
}
```

**Notas:**
- No se elimina físicamente de la base de datos
- Se marca como `isActive: false`
- Se preserva la imagen en Cloudinary para historial
- Solo administradores pueden realizar esta acción

## 🧪 Pruebas

### Ejecutar Suite de Pruebas Completa

```bash
npm test
```

Este comando ejecuta `tests/testClient.js` que realiza las siguientes pruebas:

1. ✅ Crear un producto
2. ✅ Listar todos los productos
3. ✅ Buscar producto por ID
4. ✅ Actualizar producto
5. ✅ Filtrar productos por categoría
6. ✅ Eliminar producto (soft delete)

### Pruebas Manuales con Postman

Importa la colección de Postman incluida en el repositorio:

```
postman/censudex-products.postman_collection.json
```

### Pruebas con BloomRPC (GUI para gRPC)

1. Descarga [BloomRPC](https://github.com/bloomrpc/bloomrpc)
2. Importa el archivo `src/proto/product.proto`
3. Conecta a `localhost:50052`
4. Ejecuta las operaciones disponibles

## 📁 Estructura del Proyecto

```
censudex-products/
│
├── src/
│   ├── config/
│   │   ├── database.js          # Configuración de MongoDB
│   │   └── cloudinary.js        # Configuración de Cloudinary
│   │
│   ├── models/
│   │   └── Product.js           # Modelo de Producto
│   │
│   ├── services/
│   │   └── productService.js    # Lógica de negocio
│   │
│   ├── proto/
│   │   └── product.proto        # Definición del servicio gRPC
│   │
│   ├── utils/
│   │   └── validators.js        # Utilidades de validación
│   │
│   └── server.js                # Servidor gRPC principal
│
├── seeders/
│   └── productSeeder.js         # Datos de prueba
│
├── tests/
│   └── testClient.js            # Cliente de pruebas
│
├── .env                         # Variables de entorno (no incluir en Git)
├── .gitignore                   # Archivos ignorados por Git
├── package.json                 # Dependencias y scripts
└── README.md                    # Este archivo
```

## 🔒 Seguridad

### Validaciones Implementadas

- ✅ Validación de UUID v4
- ✅ Sanitización de entradas de texto
- ✅ Validación de tipos de archivo
- ✅ Límite de tamaño de imágenes (5MB)
- ✅ Validación de precios
- ✅ Prevención de duplicados
- ✅ Verificación de administradores

### Buenas Prácticas

- No se exponen contraseñas en logs
- Las imágenes se optimizan automáticamente
- Soft delete para preservar historial
- Índices en MongoDB para búsquedas eficientes

## 📊 Base de Datos

### Colección: products

```javascript
{
  "_id": ObjectId("..."),
  "id": "uuid-v4",              // UUID único
  "name": "string",             // Nombre del producto
  "description": "string",      // Descripción
  "price": 99.99,              // Precio (double)
  "category": "string",         // Categoría
  "imageUrl": "https://...",   // URL de Cloudinary
  "imagePublicId": "string",    // ID en Cloudinary
  "isActive": true,            // Estado del producto
  "createdAt": ISODate("..."), // Fecha de creación
  "updatedAt": ISODate("...")  // Última actualización
}
```

### Índices Creados

1. **unique_product_name**: Índice único en `name`
2. **category_index**: Índice en `category`
3. **active_status_index**: Índice en `isActive`
4. **text_search_index**: Índice de texto en `name` y `description`

## 🐛 Troubleshooting

### Error: "MONGODB_URI no está definida"

**Solución:** Verifica que el archivo `.env` existe y contiene la variable `MONGODB_URI`.

### Error: "Error al subir imagen a Cloudinary"

**Solución:** 
1. Verifica tus credenciales de Cloudinary en `.env`
2. Asegúrate de tener conexión a internet
3. Comprueba que la imagen no exceda 5MB

### Error: "Ya existe un producto con ese nombre"

**Solución:** Los nombres de productos deben ser únicos. Usa un nombre diferente.

### El servidor no inicia

**Solución:**
1. Verifica que MongoDB esté corriendo: `mongosh`
2. Comprueba que el puerto 50052 esté libre
3. Revisa los logs para más detalles

## 📝 Conventional Commits

Este proyecto utiliza Conventional Commits para los mensajes de commit:

```bash
# Nuevas características
git commit -m "feat: agregar validación de imágenes"

# Correcciones de bugs
git commit -m "fix: corregir error en actualización de productos"

# Documentación
git commit -m "docs: actualizar README con ejemplos"

# Refactorización
git commit -m "refactor: mejorar estructura de validadores"

# Pruebas
git commit -m "test: agregar pruebas para filtros"
```

## 📞 Soporte

Para consultas o problemas:

- **Email:** ignacio.avendano@example.com
- **Profesor:** David Araya Cádiz

## 📄 Licencia

Este proyecto es parte del Taller N°2 de Arquitectura de Sistemas - Universidad Católica del Norte.

---

**Desarrollado con ❤️ para Censudex**