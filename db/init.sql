-- =============================================================================
-- Warehouse Inventory API — Database Schema and Seed Data
-- PostgreSQL 16
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Schema
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS warehouses (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL,
    city       VARCHAR(100) NOT NULL,
    address    TEXT         NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id           SERIAL PRIMARY KEY,
    warehouse_id INTEGER      NOT NULL REFERENCES warehouses(id) ON DELETE RESTRICT,
    name         VARCHAR(255) NOT NULL,
    sku          VARCHAR(100) NOT NULL UNIQUE,
    description  TEXT,
    price        NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    quantity     INTEGER        NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    created_at   TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_warehouse_id ON products(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_products_sku          ON products(sku);

-- ---------------------------------------------------------------------------
-- Seed data — 3 warehouses, 8 products
-- ---------------------------------------------------------------------------

INSERT INTO warehouses (name, city, address) VALUES
    ('Central Distribution Center', 'Buenos Aires', 'Av. San Martín 1450, CABA'),
    ('North Regional Depot',        'Córdoba',       'Ruta Nacional 9 Km 712, Córdoba Capital'),
    ('South Logistics Hub',         'Rosario',       'Av. del Trabajo 880, Rosario')
ON CONFLICT DO NOTHING;

INSERT INTO products (warehouse_id, name, sku, description, price, quantity) VALUES
    -- Warehouse 1 — Central Distribution Center
    (1, 'Laptop ProBook 450',     'SKU-LP-001', 'Business laptop 15.6", Intel i7, 16 GB RAM, 512 GB SSD', 1299.99, 45),
    (1, 'Wireless Keyboard K380', 'SKU-KB-001', 'Compact Bluetooth keyboard, multi-device, 2 years battery', 49.99, 120),
    (1, 'USB-C Hub 7-in-1',       'SKU-HB-001', 'USB-C hub with HDMI 4K, 3×USB-A, SD card reader, PD 100W', 39.99, 200),

    -- Warehouse 2 — North Regional Depot
    (2, 'Monitor UltraWide 34"',  'SKU-MN-001', 'IPS UltraWide 3440×1440, 75 Hz, FreeSync, built-in speakers', 499.99, 30),
    (2, 'Ergonomic Office Chair',  'SKU-CH-001', 'Mesh back, lumbar support, adjustable armrests, 5-year warranty', 349.99, 18),
    (2, 'Standing Desk Frame',     'SKU-SD-001', 'Electric height-adjustable frame, dual motor, memory presets', 599.99, 10),

    -- Warehouse 3 — South Logistics Hub
    (3, 'Mechanical Keyboard MX', 'SKU-KB-002', 'Tenkeyless, Cherry MX Red switches, RGB backlight, PBT keycaps', 129.99, 75),
    (3, 'Gaming Mouse G502',      'SKU-MS-001', '25,600 DPI HERO sensor, 11 programmable buttons, 130 g weight',   79.99, 95)
ON CONFLICT (sku) DO NOTHING;
