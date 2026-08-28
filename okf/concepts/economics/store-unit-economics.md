# OKF Concept: Store Unit Economics & Financial Models
**Domain:** Financial & Store Operations  
**Specification:** Google OKF v0.2  

---

## 1. Store Capex & Opex Benchmark Matrix

| Store Format | Initial Capex (INR) | Monthly Opex (INR) | Monthly Revenue (INR) | Monthly Net Profit | Net Margin % | Payback Period |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FOFO Live Store (Tumbledry)** | ₹25,000,000 | ₹210,000 | ₹380,000 | ₹170,000 | 44.7% | 15 Months |
| **Micro Laundromat (UClean)** | ₹1,800,000 | ₹155,000 | ₹280,000 | ₹125,000 | 44.6% | 14 Months |
| **Tech Franchise (DhobiLite)** | ₹2,000,000 | ₹175,000 | ₹320,000 | ₹145,000 | 45.3% | 14 Months |
| **CPU Hub (Fabricspa)** | ₹8,500,000 | ₹580,000 | ₹950,000 | ₹370,000 | 38.9% | 23 Months |
| **"Can't Say No" Partner** | ₹1,600,000 | ₹135,000 | ₹310,000 | ₹175,000 | 56.4% | 9 Months |

---

## 2. SPO RDF Triples

```ttl
@prefix okf: <http://google.com/okf/v0.2/> .
@prefix ex: <http://laundry.org/entity/> .

ex:Tumbledry_Store okf:hasCapex "INR 2500000" ;
                   okf:hasMonthlyOpex "INR 210000" ;
                   okf:hasPaybackPeriod "15 Months" .

ex:UClean_Store okf:hasCapex "INR 1800000" ;
                okf:hasMonthlyOpex "INR 155000" ;
                okf:hasPaybackPeriod "14 Months" .
```
