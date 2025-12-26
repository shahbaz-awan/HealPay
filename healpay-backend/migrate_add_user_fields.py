"""
Migration script to add phone, address, city, state, zip_code fields to users table
"""
from sqlalchemy import create_engine, text
from app.core.config import settings

def migrate():
    """Add new fields to users table"""
    engine = create_engine(settings.DATABASE_URL)
    
    try:
        with engine.connect() as connection:
            # Check if columns already exist
            check_query = text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='users' AND column_name='phone'
            """)
            result = connection.execute(check_query)
            
            if result.fetchone():
                print("Columns already exist. No migration needed.")
                return
            
            # Add new columns
            print("Adding new columns to users table...")
            
            alter_queries = [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS address VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS state VARCHAR",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS zip_code VARCHAR"
            ]
            
            for query in alter_queries:
                connection.execute(text(query))
                connection.commit()
                print(f"Executed: {query}")
            
            print("\n" + "="*60)
            print("Migration completed successfully!")
            print("="*60)
            
    except Exception as e:
        print(f"Migration failed: {e}")
        raise

if __name__ == "__main__":
    migrate()


