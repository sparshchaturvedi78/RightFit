-- Skill catalog: categories become first-class (admin creates them), and each skill points at one category
-- instead of holding free text. Existing free-text categories are copied across, then the text column goes.

CREATE TABLE skill_categories (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO skill_categories (name)
SELECT DISTINCT TRIM(category) FROM skills
WHERE category IS NOT NULL AND TRIM(category) <> ''
ON CONFLICT (name) DO NOTHING;

ALTER TABLE skills ADD COLUMN category_id BIGINT REFERENCES skill_categories (id);

UPDATE skills s SET category_id = c.id
FROM skill_categories c
WHERE c.name = TRIM(s.category);

ALTER TABLE skills DROP COLUMN category;

CREATE INDEX idx_skills_category_id ON skills (category_id);
