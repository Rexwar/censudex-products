/**
 * Utilidades de validación para el servicio de productos
 */

/**
 * Valida que un UUID sea válido (v4)
 * @param {string} uuid - UUID a validar
 * @returns {boolean}
 */
const isValidUUID = (uuid) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Valida que el precio sea un número positivo
 * @param {number} price - Precio a validar
 * @returns {Object} - {isValid, message}
 */
const validatePrice = (price) => {
  if (isNaN(price)) {
    return { isValid: false, message: 'El precio debe ser un número' };
  }
  if (price <= 0) {
    return { isValid: false, message: 'El precio debe ser mayor a 0' };
  }
  if (price > 9999999.99) {
    return { isValid: false, message: 'El precio excede el límite permitido' };
  }
  return { isValid: true };
};

/**
 * Valida que el nombre del producto sea válido
 * @param {string} name - Nombre a validar
 * @returns {Object} - {isValid, message}
 */
const validateProductName = (name) => {
  if (!name || typeof name !== 'string') {
    return { isValid: false, message: 'El nombre es requerido' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 3) {
    return { isValid: false, message: 'El nombre debe tener al menos 3 caracteres' };
  }
  
  if (trimmedName.length > 100) {
    return { isValid: false, message: 'El nombre no puede exceder 100 caracteres' };
  }

  // No permitir solo números
  if (/^\d+$/.test(trimmedName)) {
    return { isValid: false, message: 'El nombre no puede contener solo números' };
  }

  return { isValid: true };
};

/**
 * Valida que la descripción sea válida
 * @param {string} description - Descripción a validar
 * @returns {Object} - {isValid, message}
 */
const validateDescription = (description) => {
  if (!description || typeof description !== 'string') {
    return { isValid: false, message: 'La descripción es requerida' };
  }
  
  const trimmedDesc = description.trim();
  
  if (trimmedDesc.length < 10) {
    return { isValid: false, message: 'La descripción debe tener al menos 10 caracteres' };
  }
  
  if (trimmedDesc.length > 1000) {
    return { isValid: false, message: 'La descripción no puede exceder 1000 caracteres' };
  }

  return { isValid: true };
};

/**
 * Valida que la categoría sea válida
 * @param {string} category - Categoría a validar
 * @returns {Object} - {isValid, message}
 */
const validateCategory = (category) => {
  if (!category || typeof category !== 'string') {
    return { isValid: false, message: 'La categoría es requerida' };
  }
  
  const trimmedCategory = category.trim();
  
  if (trimmedCategory.length < 3) {
    return { isValid: false, message: 'La categoría debe tener al menos 3 caracteres' };
  }
  
  if (trimmedCategory.length > 50) {
    return { isValid: false, message: 'La categoría no puede exceder 50 caracteres' };
  }

  return { isValid: true };
};

/**
 * Valida que la imagen sea válida
 * @param {Buffer} imageBuffer - Buffer de la imagen
 * @param {string} fileName - Nombre del archivo
 * @returns {Object} - {isValid, message}
 */
const validateImage = (imageBuffer, fileName) => {
  if (!imageBuffer || imageBuffer.length === 0) {
    return { isValid: false, message: 'La imagen es requerida' };
  }

  // Validar tamaño (máximo 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB en bytes
  if (imageBuffer.length > maxSize) {
    return { isValid: false, message: 'La imagen no puede exceder 5MB' };
  }

  // Validar extensión del archivo
  if (fileName) {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const fileExtension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (!allowedExtensions.includes(fileExtension)) {
      return { 
        isValid: false, 
        message: `Extensión no permitida. Use: ${allowedExtensions.join(', ')}` 
      };
    }
  }

  return { isValid: true };
};

/**
 * Valida que el ID del administrador sea válido
 * @param {string} adminId - ID del administrador
 * @returns {Object} - {isValid, message}
 */
const validateAdminId = (adminId) => {
  if (!adminId || typeof adminId !== 'string') {
    return { isValid: false, message: 'El ID del administrador es requerido' };
  }
  
  if (!isValidUUID(adminId)) {
    return { isValid: false, message: 'El ID del administrador no es válido' };
  }

  return { isValid: true };
};

/**
 * Sanitiza una cadena de texto eliminando caracteres peligrosos
 * @param {string} text - Texto a sanitizar
 * @returns {string}
 */
const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Eliminar < y >
    .replace(/\s+/g, ' '); // Normalizar espacios
};

/**
 * Crea una respuesta de error estandarizada
 * @param {string} message - Mensaje de error
 * @param {string} code - Código de error gRPC
 * @returns {Object}
 */
const createErrorResponse = (message, code = 'INVALID_ARGUMENT') => {
  return {
    success: false,
    message,
    code
  };
};

/**
 * Crea una respuesta exitosa estandarizada
 * @param {string} message - Mensaje de éxito
 * @param {Object} data - Datos adicionales
 * @returns {Object}
 */
const createSuccessResponse = (message, data = {}) => {
  return {
    success: true,
    message,
    ...data
  };
};

module.exports = {
  isValidUUID,
  validatePrice,
  validateProductName,
  validateDescription,
  validateCategory,
  validateImage,
  validateAdminId,
  sanitizeText,
  createErrorResponse,
  createSuccessResponse
};