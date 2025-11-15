const cloudinary = require('cloudinary').v2;
require('dotenv').config();

/**
 * Configuración de Cloudinary para gestión de imágenes
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

/**
 * Sube una imagen a Cloudinary desde un buffer
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} fileName - Nombre del archivo original
 * @param {string} folder - Carpeta en Cloudinary (opcional)
 * @returns {Promise<Object>} - Objeto con la URL y public_id de la imagen
 */
const uploadImage = async (imageBuffer, fileName, folder = 'censudex/products') => {
  try {
    // Validar que el buffer exista
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error('El buffer de la imagen está vacío');
    }

    // Convertir el buffer a base64
    const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    // Opciones de carga
    const uploadOptions = {
      folder: folder,
      public_id: `product_${Date.now()}`, // ID único basado en timestamp
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, // Limitar tamaño máximo
        { quality: 'auto' }, // Optimización automática de calidad
        { fetch_format: 'auto' } // Formato automático según el navegador
      ],
      tags: ['product', 'censudex']
    };

    // Subir la imagen a Cloudinary
    const result = await cloudinary.uploader.upload(base64Image, uploadOptions);

    console.log('✅ Imagen subida a Cloudinary:', result.public_id);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format
    };
  } catch (error) {
    console.error('❌ Error al subir imagen a Cloudinary:', error.message);
    throw new Error(`Error al subir imagen: ${error.message}`);
  }
};

/**
 * Elimina una imagen de Cloudinary
 * @param {string} publicId - ID público de la imagen en Cloudinary
 * @returns {Promise<Object>} - Resultado de la eliminación
 */
const deleteImage = async (publicId) => {
  try {
    if (!publicId) {
      throw new Error('El publicId es requerido para eliminar la imagen');
    }

    const result = await cloudinary.uploader.destroy(publicId);

    console.log('✅ Imagen eliminada de Cloudinary:', publicId);

    return result;
  } catch (error) {
    console.error('❌ Error al eliminar imagen de Cloudinary:', error.message);
    throw new Error(`Error al eliminar imagen: ${error.message}`);
  }
};

/**
 * Actualiza una imagen en Cloudinary (elimina la anterior y sube la nueva)
 * @param {string} oldPublicId - ID de la imagen anterior
 * @param {Buffer} newImageBuffer - Buffer de la nueva imagen
 * @param {string} fileName - Nombre del archivo
 * @param {string} folder - Carpeta en Cloudinary
 * @returns {Promise<Object>} - Datos de la nueva imagen
 */
const updateImage = async (oldPublicId, newImageBuffer, fileName, folder = 'censudex/products') => {
  try {
    // Subir la nueva imagen
    const newImage = await uploadImage(newImageBuffer, fileName, folder);

    // Eliminar la imagen anterior solo si la nueva se subió correctamente
    if (oldPublicId) {
      await deleteImage(oldPublicId).catch(err => {
        console.warn('⚠️ No se pudo eliminar la imagen anterior:', err.message);
      });
    }

    return newImage;
  } catch (error) {
    console.error('❌ Error al actualizar imagen:', error.message);
    throw error;
  }
};

/**
 * Verifica la conexión con Cloudinary
 * @returns {Promise<boolean>}
 */
const testConnection = async () => {
  try {
    const result = await cloudinary.api.ping();
    console.log('✅ Conexión con Cloudinary establecida');
    return result.status === 'ok';
  } catch (error) {
    console.error('❌ Error al conectar con Cloudinary:', error.message);
    return false;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  deleteImage,
  updateImage,
  testConnection
};