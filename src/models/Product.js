const { v4: uuidv4 } = require('uuid');

/**
 * Clase que representa el modelo de Producto
 */
class Product {
  /**
   * Constructor del modelo Product
   * @param {Object} data - Datos del producto
   */
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.description = data.description;
    this.price = parseFloat(data.price);
    this.category = data.category;
    this.imageUrl = data.imageUrl || '';
    this.imagePublicId = data.imagePublicId || '';
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Valida los datos del producto antes de guardar
   * @returns {Object} - Objeto con isValid y errores
   */
  validate() {
    const errors = [];

    // Validar nombre (requerido, mínimo 3 caracteres)
    if (!this.name || this.name.trim().length < 3) {
      errors.push('El nombre del producto debe tener al menos 3 caracteres');
    }

    // Validar descripción (requerida)
    if (!this.description || this.description.trim().length < 10) {
      errors.push('La descripción debe tener al menos 10 caracteres');
    }

    // Validar precio (debe ser positivo)
    if (isNaN(this.price) || this.price <= 0) {
      errors.push('El precio debe ser un número positivo');
    }

    // Validar categoría (requerida)
    if (!this.category || this.category.trim().length === 0) {
      errors.push('La categoría es requerida');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Convierte el producto a un objeto plano para MongoDB
   * @returns {Object}
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name.trim(),
      description: this.description.trim(),
      price: this.price,
      category: this.category.trim(),
      imageUrl: this.imageUrl,
      imagePublicId: this.imagePublicId,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Convierte el producto al formato de respuesta gRPC
   * @returns {Object}
   */
  toGRPC() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      price: this.price,
      category: this.category,
      imageUrl: this.imageUrl,
      isActive: this.isActive,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Crea una instancia de Product desde un documento de MongoDB
   * @param {Object} doc - Documento de MongoDB
   * @returns {Product}
   */
  static fromDocument(doc) {
    return new Product({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      price: doc.price,
      category: doc.category,
      imageUrl: doc.imageUrl,
      imagePublicId: doc.imagePublicId,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    });
  }

  /**
   * Actualiza los campos del producto
   * @param {Object} updates - Campos a actualizar
   */
  update(updates) {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.price !== undefined) this.price = parseFloat(updates.price);
    if (updates.category !== undefined) this.category = updates.category;
    if (updates.imageUrl !== undefined) this.imageUrl = updates.imageUrl;
    if (updates.imagePublicId !== undefined) this.imagePublicId = updates.imagePublicId;
    if (updates.isActive !== undefined) this.isActive = updates.isActive;

    // Actualizar timestamp
    this.updatedAt = new Date();
  }

  /**
   * Marca el producto como inactivo (soft delete)
   */
  softDelete() {
    this.isActive = false;
    this.updatedAt = new Date();
  }
}

module.exports = Product;