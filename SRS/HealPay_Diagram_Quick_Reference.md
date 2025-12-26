# HealPay Medical Billing System - Diagram Quick Reference

## ONE-LINE "WHY" FOR EACH DIAGRAM

| Diagram | Why It's Needed (One Line) |
|---------|---------------------------|
| **Use Case Diagram** | Defines WHAT the system does - shows all actors and their functional requirements |
| **Domain Model** | Shows business concepts and relationships - helps understand the medical billing domain |
| **ERD** | Database blueprint - ensures data integrity with proper tables, keys, and relationships |
| **Component Diagram** | Physical architecture - shows reusable software components and how they connect |
| **Package Diagram** | Code organization - shows logical modules and dependencies for maintainability |
| **Activity Diagram** | Business workflow - visualizes complete process flow with all actors involved |
| **DFD Level 0** | System boundaries - shows what interacts with the system from outside |
| **DFD Level 1** | Major processes - high-level view of what the system does with data |
| **DFD Level 2** | Detailed processes - implementation-level detail for developers |
| **SSD - Register/Login** | Authentication flow - shows user login/registration with alternative paths |
| **SSD - Intake Form** | Data collection - patient information entry with validation workflow |
| **SSD - Assign Codes** | AI-assisted coding - medical code assignment with ML recommendations |
| **SSD - Generate Claim** | Claim creation - billing document generation with AI rejection prediction |
| **SSD - Submit/Track** | EDI submission - electronic claim transmission and status monitoring |
| **SSD - Payment** | Transaction processing - secure payment handling with success/failure scenarios |
| **SSD - Manage Users** | Administration - user account lifecycle management (create/modify/deactivate) |

---

## DIAGRAM GROUPING BY PURPOSE

### **REQUIREMENTS & SCOPE**
- **Use Case Diagram** → What functions the system provides
- **DFD Level 0** → System boundaries and external entities

### **BUSINESS MODELING**
- **Domain Model** → Business concepts and vocabulary
- **Activity Diagram** → Business process workflows

### **DATA MODELING**
- **ERD** → Database structure and data relationships

### **ARCHITECTURE & DESIGN**
- **Component Diagram** → Physical system components
- **Package Diagram** → Logical code organization
- **DFD Level 1 & 2** → Data processing workflows

### **BEHAVIORAL MODELING**
- **System Sequence Diagrams** → Detailed user-system interactions for each use case

---

## KEY DIAGRAM ELEMENTS TO HIGHLIGHT

### Use Case Diagram
- ✅ 6 actors, 20+ use cases
- ✅ Include/Extend relationships show reusable and optional features
- ✅ AI features (Code Recommendations, Rejection Prediction) shown as extend

### ERD
- ✅ 9+ entities with complete attributes
- ✅ Foreign keys maintain relationships
- ✅ Cardinalities ensure data integrity

### Component Diagram
- ✅ 4 layers (UI, Services, Data, Infrastructure)
- ✅ Ports and interfaces show component communication
- ✅ Clean separation of concerns

### Sequence Diagrams
- ✅ ALT fragments show alternative flows
- ✅ OPT fragments show optional behaviors (AI features)
- ✅ LOOP fragments show iterative processes
- ✅ Complete message flow with return values

---

## PRESENTATION FLOW SUGGESTION

1. **Introduction** → Problem → Objectives
2. **Requirements** → Use Case Diagram (WHAT)
3. **Business Model** → Domain Model → Activity Diagram (HOW BUSINESS WORKS)
4. **Data Design** → ERD (DATA STRUCTURE)
5. **System Design** → Component → Package (ARCHITECTURE)
6. **Process Design** → DFD Level 0 → 1 → 2 (DATA FLOW)
7. **Detailed Interactions** → SSDs (SPECIFIC WORKFLOWS)
8. **AI/ML Features** → Highlight extend relationships and OPT fragments
9. **Conclusion** → Benefits → Future Work

---

## COMMON QUESTIONS & BRIEF ANSWERS

**Q: Why Use Case before ERD?**
A: Use Cases define WHAT users need (requirements), ERD shows HOW data is stored (design).

**Q: Difference between Domain Model and ERD?**
A: Domain Model = business concepts (conceptual), ERD = database tables (technical).

**Q: Why multiple DFD levels?**
A: Level 0 = scope, Level 1 = major functions, Level 2 = detailed implementation.

**Q: How do SSDs relate to Use Cases?**
A: Each major Use Case has an SSD showing detailed interaction sequence.

**Q: Where is AI shown?**
A: Use Cases (extend relationships), SSDs (OPT fragments for AI features).

---

Use this as a quick reference during your presentation! 📊

