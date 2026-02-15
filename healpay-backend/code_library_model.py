# Code Library for AI-powered recommendations
class CodeLibrary(Base):
    __tablename__ = "code_library"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, index=True)  # e.g., "I10", "99213"
    code_type = Column(String, nullable=False, index=True)  # "ICD10_CM", "CPT", "HCPCS"
    short_description = Column(String, nullable=False)
    long_description = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    
    # Searchable text combining code and descriptions for embedding/matching
    search_text = Column(Text, nullable=False)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    billable = Column(Boolean, default=True, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<CodeLibrary {self.code}: {self.short_description}>"
