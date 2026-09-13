/**
 * @module seedData
 * Initial menu — runs once on first load if localStorage is empty
 */
export const SEED_PIZZAS = [
  { id: 'pizza-001', name: 'مارغريتا الكلاسيك',   description: 'البيتزا الإيطالية الأصيلة بأبسط مكوناتها وأعمق نكهاتها', price: 89,  category: 'classic', ingredients: ['صلصة طماطم طازجة','موزاريلا','ريحان طازج'],                                    heatLevel: 0, badge: 'الأكثر طلباً', rating: 4.8, reviewCount: 312 },
  { id: 'pizza-002', name: 'ببروني سبيشال',         description: 'طبقات متراكمة من الببروني المقرمش على سريرٍ من موزاريلا ذائبة', price: 129, category: 'special', ingredients: ['ببروني','موزاريلا','صلصة خاصة','فلفل أخضر'],                          heatLevel: 2, badge: '🔥 الأوفر مبيعاً', rating: 4.9, reviewCount: 245 },
  { id: 'pizza-003', name: 'نارية الجحيم',           description: 'تحدي حقيقي لمن يعشق الحرارة — ليست للقلوب الضعيفة',        price: 119, category: 'hot',     ingredients: ['صلصة حارة','جالابينيو','فلفل حراني','دجاج حار','صلصة رانش'], heatLevel: 5, badge: '🌶 للشجعان', rating: 4.7, reviewCount: 132 },
  { id: 'pizza-004', name: 'خضار الجنة',             description: 'تشكيلة من أطيب الخضروات الطازجة على عجينة مقرمشة',          price: 99,  category: 'veggie',  ingredients: ['فلفل ألوان','مشروم','زيتون','بصل','طماطم','موزاريلا'],         heatLevel: 0, badge: '🌿 نباتي', rating: 4.6, reviewCount: 89  },
  { id: 'pizza-005', name: 'دجاج بربيكيو',            description: 'صدر دجاج مشوي مع صلصة البربيكيو الحلوة والبصل الكراميل',    price: 139, category: 'special', ingredients: ['دجاج مشوي','صلصة بربيكيو','بصل كراميل','موزاريلا'],          heatLevel: 1, badge: null, rating: 4.8, reviewCount: 178 },
  { id: 'pizza-006', name: 'أربعة جبن',               description: 'مزيج فاخر من أربعة أنواع جبن إيطالية أصيلة',                price: 149, category: 'classic', ingredients: ['موزاريلا','جورجونزولا','بارميزان','ريكوتا'],                  heatLevel: 0, badge: '⭐ فاخر', rating: 4.9, reviewCount: 201 },
  { id: 'pizza-007', name: 'مكسيكانا حارة',           description: 'نكهات مكسيكية أصيلة بلمسة إيطالية',                         price: 125, category: 'hot',     ingredients: ['لحم مفروم','جالابينيو','فاصوليا','ذرة','صلصة تاكو'],          heatLevel: 4, badge: '🌮 فيوجن', rating: 4.5, reviewCount: 76  },
  { id: 'pizza-008', name: 'مشروم تروفل',             description: 'زيت التروفل الفاخر مع مشروم بورتوبيلو',                      price: 169, category: 'veggie',  ingredients: ['مشروم بورتوبيلو','زيت تروفل','بارميزان','روزماري'],           heatLevel: 0, badge: '✨ بريميوم', rating: 4.7, reviewCount: 94  },
];

/**
 * @param {IPizzaRepository} pizzaRepo
 */
export async function seedIfEmpty(pizzaRepo) {
  const existing = await pizzaRepo.findAll();
  if (existing.length > 0) return;

  await Promise.all(
    SEED_PIZZAS.map(data => {
      const { Pizza } = window.__domain__;
      const pizza = new Pizza(data);
      return pizzaRepo.save(pizza);
    })
  );
}
