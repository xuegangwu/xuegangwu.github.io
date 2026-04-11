-- Get IDs
ATTACH DATABASE '/var/www/design.solaripple.com/server/design.db' AS design;

-- Insert battery module
INSERT INTO design.components (id, type, parentId, level, brand, model, name, specs, price)
SELECT 
  lower(hex(randomblob(16))),
  'module',
  (SELECT id FROM design.components WHERE type='battery' LIMIT 1),
  1,
  '宁德时代',
  'CATL-MODULE-1',
  '电池模组1P10S',
  '{"cells":"10S","arrangement":"1P10S","voltage":"32V","capacity":"280Ah","weight":"25kg"}',
  2800;
