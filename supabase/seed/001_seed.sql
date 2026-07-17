-- =====================================================================
-- Seed de ejemplo (NO se ejecuta en producción con data real)
-- Pegar y correr DESPUÉS del schema inicial.
-- =====================================================================

insert into public.malls (id, nombre, ciudad) values
  ('MALL-001', 'Andino',               'Bogotá'),
  ('MALL-002', 'Unicentro',            'Bogotá'),
  ('MALL-003', 'Santafé',               'Bogotá'),
  ('MALL-004', 'El Tesoro',             'Medellín'),
  ('MALL-005', 'Palmetto',              'Cali'),
  ('MALL-006', 'Chipichape',            'Cali'),
  ('MALL-007', 'Gran Estación',         'Bogotá'),
  ('MALL-008', 'Plaza de las Américas', 'Bogotá')
on conflict (id) do nothing;

insert into public.tiendas (id, mall_id, nombre) values
  ('TIEN-001', 'MALL-001', 'Falabella'),
  ('TIEN-002', 'MALL-001', 'Ripley'),
  ('TIEN-003', 'MALL-001', 'Éxito'),
  ('TIEN-004', 'MALL-002', 'Falabella'),
  ('TIEN-005', 'MALL-002', 'Éxito'),
  ('TIEN-006', 'MALL-003', 'Falabella'),
  ('TIEN-007', 'MALL-003', 'Ripley'),
  ('TIEN-008', 'MALL-004', 'Falabella'),
  ('TIEN-009', 'MALL-004', 'Éxito'),
  ('TIEN-010', 'MALL-005', 'Falabella'),
  ('TIEN-011', 'MALL-006', 'Ripley'),
  ('TIEN-012', 'MALL-007', 'Falabella'),
  ('TIEN-013', 'MALL-008', 'Éxito')
on conflict (id) do nothing;

insert into public.corners
  (corner_id, mall_id, tienda_id, marca, categoria, estado, fecha_ultima_actualizacion, responsable, notas)
values
  ('CRN-A1B2C3', 'MALL-001', 'TIEN-001', 'JC',  'Casual',   'actualizado',         '2026-05-12', 'Carlos Méndez',    'Mobiliario nuevo instalado en abril'),
  ('CRN-B2C3D4', 'MALL-001', 'TIEN-001', 'JC',  'Interior', 'pendiente',           '2025-11-03', 'Carlos Méndez',    'Requiere visita de levantamiento'),
  ('CRN-C3D4E5', 'MALL-001', 'TIEN-001', 'JCX', 'Casual',   'requiere_inversion',  '2025-09-21', 'Carlos Méndez',    'Cotización enviada a gerencia'),
  ('CRN-D4E5F6', 'MALL-001', 'TIEN-002', 'CK',  'Interior', 'actualizado',         '2026-04-18', 'Laura Pérez',      null),
  ('CRN-E5F6G7', 'MALL-002', 'TIEN-004', 'JC',  'Casual',   'actualizado',         '2026-03-30', 'Carlos Méndez',    null),
  ('CRN-F6G7H8', 'MALL-002', 'TIEN-004', 'JCB', 'Casual',   'sin_mobiliario',      '2025-07-15', 'Carlos Méndez',    'Espacio asignado pero sin mobiliario'),
  ('CRN-G7H8I9', 'MALL-002', 'TIEN-005', 'JC',  'Casual',   'en_mantenimiento',    '2026-01-22', 'Laura Pérez',      'Iluminación en reparación'),
  ('CRN-H8I9J0', 'MALL-003', 'TIEN-006', 'JCX', 'Casual',   'actualizado',         '2026-05-02', 'Carlos Méndez',    null),
  ('CRN-I9J0K1', 'MALL-003', 'TIEN-007', 'CK',  'Interior', 'pendiente',           '2025-12-10', 'Laura Pérez',      null),
  ('CRN-J0K1L2', 'MALL-004', 'TIEN-008', 'JC',  'Casual',   'actualizado',         '2026-04-05', 'Andrés López',     null),
  ('CRN-K1L2M3', 'MALL-004', 'TIEN-009', 'JC',  'Interior', 'actualizado',         '2026-02-14', 'Andrés López',     null),
  ('CRN-L2M3N4', 'MALL-005', 'TIEN-010', 'JCX', 'Casual',   'requiere_inversion',  '2025-10-08', 'Diana Restrepo',   'Esperando aprobación presupuesto'),
  ('CRN-M3N4O5', 'MALL-006', 'TIEN-011', 'CK',  'Casual',   'pendiente',           '2025-11-25', 'Diana Restrepo',   null),
  ('CRN-N4O5P6', 'MALL-007', 'TIEN-012', 'JCB', 'Casual',   'actualizado',         '2026-05-28', 'Carlos Méndez',    null),
  ('CRN-O5P6Q7', 'MALL-008', 'TIEN-013', 'JC',  'Interior', 'sin_mobiliario',      '2025-06-04', 'Laura Pérez',      'Stand vacío desde mudanza')
on conflict (corner_id) do nothing;
