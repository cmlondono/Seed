-- ============================================================
-- SEED INICIAL
-- ============================================================

-- Configuración del negocio
INSERT INTO public.configuracion (nombre_negocio, telefono, email, ciudad, pais, moneda, simbolo_moneda, porcentaje_impuesto)
VALUES ('Centro de Belleza', '+57 300 000 0000', 'admin@negocio.com', 'Medellín', 'Colombia', 'COP', '$', 0)
ON CONFLICT DO NOTHING;

-- Categorías de inventario
INSERT INTO public.categorias_inventario (nombre, descripcion) VALUES
  ('Coloración', 'Productos para teñir y colorar'),
  ('Cuidado Capilar', 'Shampoos, acondicionadores y tratamientos'),
  ('Químicos', 'Permanentes, alisados y químicos'),
  ('Herramientas', 'Tijeras, peines, cepillos'),
  ('Accesorios', 'Pines, ligas, diademas')
ON CONFLICT DO NOTHING;

-- Servicios de ejemplo
INSERT INTO public.servicios (nombre, descripcion, duracion_minutos, precio) VALUES
  ('Corte de cabello', 'Corte profesional con lavado y secado', 60, 50000),
  ('Coloración', 'Tinte completo con técnica profesional', 120, 150000),
  ('Manicure', 'Manicure completa con esmalte', 45, 35000),
  ('Pedicure', 'Pedicure completa con esmalte', 60, 45000),
  ('Tratamiento capilar', 'Hidratación profunda', 90, 80000),
  ('Mechas', 'Mechas californianas o babylights', 150, 200000),
  ('Alisado', 'Alisado brasileño o keratina', 180, 250000)
ON CONFLICT DO NOTHING;
