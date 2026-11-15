import type { WasteItem } from "../types";

export const WASTE_ITEMS: WasteItem[] = [
  {
    id: "newspaper",
    name: "Newspaper",
    keywords: ["newspaper", "newsprint", "daily paper"],
    material: "Paper",
    category: "recycle",
    emoji: "📰",
    weightKg: 0.12,
    emissionFactorPerKg: 1,
    preparation: "Keep it dry and loose. Remove plastic sleeves.",
    why: "Clean newspaper is a standard paper recyclable. Wet or food-soiled paper is a different case.",
    environmentalNote:
      "Paper recycling is usually compared with making pulp from fresh fiber. The emissions figure here is a rounded illustration.",
  },
  {
    id: "office-paper",
    name: "Office paper",
    keywords: ["office paper", "printer paper", "copy paper"],
    material: "Paper",
    category: "recycle",
    emoji: "📄",
    weightKg: 0.05,
    emissionFactorPerKg: 1,
    preparation:
      "Leave staples if your program allows them. Skip paper that is wet, waxed, or heavily soiled.",
    why: "Plain office paper is widely accepted in curbside recycling when it is clean and dry.",
    environmentalNote:
      "A small stack of paper does not create a large measured savings. This app only shows a rough factor.",
  },
  {
    id: "magazine",
    name: "Magazine",
    keywords: ["magazine", "glossy magazine"],
    material: "Paper",
    category: "recycle",
    emoji: "📖",
    weightKg: 0.2,
    emissionFactorPerKg: 1,
    preparation:
      "Remove plastic wrap. Most programs accept the glossy pages and the stapled binding.",
    why: "Magazines are paper. Glossy coating is accepted by many city programs, but not by every one.",
    environmentalNote:
      "Recycling magazines can return fiber to new paper products when the load stays clean.",
  },
  {
    id: "junk-mail",
    name: "Junk mail",
    keywords: ["junk mail", "mail", "flyer"],
    material: "Paper",
    category: "recycle",
    emoji: "✉️",
    weightKg: 0.04,
    emissionFactorPerKg: 1,
    preparation:
      "Remove plastic windows if your flyer asks you to. A few programs want those windows taken off.",
    why: "Most mail is paper and can be recycled when it is dry. Plastic wrap around catalogs should come off first.",
    environmentalNote:
      "Mail is light. Sorting it correctly matters more as a habit than as a large weight of material.",
  },
  {
    id: "shredded-paper",
    name: "Loose shredded paper",
    keywords: ["shredded paper", "shredded", "paper shreds"],
    material: "Paper",
    category: "special",
    emoji: "📃",
    weightKg: 0.08,
    preparation:
      "Do not put loose shreds in the recycling bin until your hauler says how they want them.",
    why: "Loose shreds fall through sorting machines. Some cities want a paper bag, some compost shreds, and some say trash.",
    environmentalNote:
      "Because the right bin depends on the city, this app does not count shredded paper as ordinary recycling.",
  },
  {
    id: "cardboard-box",
    name: "Cardboard box",
    keywords: ["cardboard", "cardboard box", "shipping box"],
    material: "Cardboard",
    category: "recycle",
    emoji: "📦",
    weightKg: 0.25,
    emissionFactorPerKg: 1,
    preparation:
      "Flatten it, keep it dry, and remove large plastic film or foam.",
    why: "Clean corrugated cardboard is a core curbside recyclable. Grease, foam, and plastic liners are the usual reasons a box is rejected.",
    environmentalNote:
      "Cardboard is one of the heavier common recyclables in a household, so clean boxes add up on a weight estimate.",
  },
  {
    id: "pizza-box-clean",
    name: "Clean pizza box",
    keywords: ["clean pizza box", "pizza box lid"],
    material: "Cardboard",
    category: "recycle",
    emoji: "📦",
    weightKg: 0.12,
    emissionFactorPerKg: 1,
    preparation:
      "Recycle only the parts with no grease or cheese. Tear those sections off if you need to.",
    why: "Clean cardboard can be recycled. Oily cardboard cannot, even if the rest of the box looks fine.",
    environmentalNote:
      "Splitting a box into clean and greasy parts keeps the clean fiber in the recycling stream.",
  },
  {
    id: "pizza-box-greasy",
    name: "Greasy pizza box",
    keywords: ["greasy pizza", "oily pizza box", "used pizza box"],
    material: "Cardboard",
    category: "compost",
    emoji: "🍕",
    weightKg: 0.15,
    preparation:
      "If your green bin accepts food-soiled paper, put the greasy part there. Otherwise use the trash.",
    why: "Grease keeps this cardboard out of recycling. Some organics programs take food-soiled paper, and some do not.",
    environmentalNote:
      "This app uses compost as the teaching category and tells you to follow the local organics list.",
  },
  {
    id: "egg-carton",
    name: "Cardboard egg carton",
    keywords: ["egg carton", "cardboard egg carton"],
    material: "Cardboard",
    category: "recycle",
    emoji: "🥚",
    weightKg: 0.04,
    emissionFactorPerKg: 1,
    preparation:
      "Paper pulp cartons can be recycled or, in some programs, composted. Plastic foam cartons are a different item.",
    why: "Molded paper cartons behave like paper. Foam cartons are rarely accepted in the recycling bin.",
    environmentalNote:
      "A paper carton is a small amount of fiber. The important part is not mixing it up with foam.",
  },
  {
    id: "plastic-bottle",
    name: "Plastic water bottle",
    keywords: ["plastic bottle", "water bottle", "pet bottle", "soda bottle"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧴",
    weightKg: 0.02,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it. Put the cap back on if your current city flyer says to.",
    why: "Empty PET drink bottles are widely accepted. Caps, colored plastic, and local exceptions still vary.",
    environmentalNote:
      "A single bottle is only about 20 grams. The illustrative plastic factor is not a measurement of this bottle.",
  },
  {
    id: "milk-jug",
    name: "Plastic milk jug",
    keywords: ["milk jug", "hdpe jug", "plastic jug"],
    material: "Plastic",
    category: "recycle",
    emoji: "🥛",
    weightKg: 0.04,
    emissionFactorPerKg: 1.5,
    preparation:
      "Rinse it and replace the cap if your program asks for caps on.",
    why: "HDPE jugs are a common curbside plastic. They still need to be empty.",
    environmentalNote:
      "Rinsing keeps food out of the plastic bale, which is what makes the material usable.",
  },
  {
    id: "yogurt-tub",
    name: "Yogurt tub",
    keywords: ["yogurt", "yogurt tub", "yoghurt"],
    material: "Plastic",
    category: "recycle",
    emoji: "🥣",
    weightKg: 0.015,
    emissionFactorPerKg: 1.5,
    preparation:
      "Scrape or rinse it. Check whether your city accepts tubs, not only bottles.",
    why: "Rigid tubs are accepted in many California programs and refused in others. The city list decides.",
    environmentalNote:
      "A tub is very light. Logging it is useful for the habit, not for a large weight total.",
  },
  {
    id: "clamshell",
    name: "Plastic berry clamshell",
    keywords: ["clamshell", "berry container", "plastic container"],
    material: "Plastic",
    category: "recycle",
    emoji: "🍓",
    weightKg: 0.02,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it and check the local list. A resin number alone does not guarantee acceptance.",
    why: "Clear clamshells are often PET, but some programs still limit them to bottles and jugs.",
    environmentalNote:
      "When a program does accept them, they need to be free of leftover food.",
  },
  {
    id: "plastic-bag",
    name: "Plastic grocery bag",
    keywords: ["plastic bag", "grocery bag", "shopping bag"],
    material: "Plastic",
    category: "special",
    emoji: "🛍️",
    weightKg: 0.006,
    preparation:
      "Bundle clean, dry bags for a store film take-back. Do not put them loose in curbside recycling.",
    why: "Bags tangle sorting equipment. Most curbside programs, including common Los Angeles guidance, keep them out of the blue bin.",
    environmentalNote:
      "Store drop-off is a separate stream from bottle recycling. This app treats bags as special drop-off.",
  },
  {
    id: "plastic-film",
    name: "Plastic food wrap",
    keywords: ["plastic wrap", "plastic film", "cling film"],
    material: "Plastic",
    category: "special",
    emoji: "🎁",
    weightKg: 0.005,
    preparation:
      "Clean, dry film sometimes belongs with store bag take-back. Dirty wrap is trash.",
    why: "Stretchy film is not a bottle or tub. Loose film causes the same tangles as bags.",
    environmentalNote:
      "Only clean and dry film has a chance at a take-back program. Food-covered wrap does not.",
  },
  {
    id: "chip-bag",
    name: "Chip bag",
    keywords: ["chip bag", "crisp packet", "snack bag"],
    material: "Plastic",
    category: "trash",
    emoji: "🍟",
    weightKg: 0.01,
    preparation:
      "Empty the crumbs and put the bag in the trash unless a printed mail-back program applies.",
    why: "Snack bags are mixed materials, not the rigid plastic that curbside programs sort.",
    environmentalNote:
      "These bags are light, but they contaminate recycling when people toss them in anyway.",
  },
  {
    id: "plastic-straw",
    name: "Plastic straw",
    keywords: ["plastic straw", "straw"],
    material: "Plastic",
    category: "trash",
    emoji: "🥤",
    weightKg: 0.001,
    preparation:
      "Put it in the trash. It is too small and the wrong shape for curbside sorting.",
    why: "Straws fall through screens and are not a target recyclable in household programs.",
    environmentalNote:
      "The weight is tiny. The lesson is that small plastic pieces are not recovered from the blue bin.",
  },
  {
    id: "plastic-utensil",
    name: "Plastic fork",
    keywords: ["plastic fork", "plastic utensil", "plastic cutlery"],
    material: "Plastic",
    category: "trash",
    emoji: "🍴",
    weightKg: 0.004,
    preparation:
      "Scrape off food and put disposable plastic cutlery in the trash.",
    why: "Utensils are the wrong shape for the machines that sort bottles, and they are often not accepted.",
    environmentalNote:
      "Reusable utensils avoid this item entirely. A single fork is not a recycling win.",
  },
  {
    id: "styrofoam-cup",
    name: "Foam cup",
    keywords: ["styrofoam", "foam cup", "polystyrene cup"],
    material: "Plastic",
    category: "trash",
    emoji: "🥤",
    weightKg: 0.005,
    preparation:
      "Put foam cups and foam food boxes in the trash unless a dedicated drop-off lists them.",
    why: "Expanded polystyrene is rarely accepted in curbside recycling. It breaks into pieces that contaminate other materials.",
    environmentalNote:
      "Foam is bulky and light. A special drop-off is the only path this app would treat differently, and only when a real site says so.",
  },
  {
    id: "aluminum-can",
    name: "Aluminum drink can",
    keywords: ["aluminum can", "soda can", "pop can"],
    material: "Metal",
    category: "recycle",
    emoji: "🥫",
    weightKg: 0.015,
    emissionFactorPerKg: 9,
    preparation: "Empty it. A quick rinse helps if it is sticky.",
    why: "Aluminum cans are one of the most consistently accepted household recyclables.",
    environmentalNote:
      "Recycled aluminum is often cited as using far less energy than new aluminum. The factor of 9 is an educational round number, not a lab result.",
  },
  {
    id: "steel-can",
    name: "Steel food can",
    keywords: ["steel can", "tin can", "food can"],
    material: "Metal",
    category: "recycle",
    emoji: "🥫",
    weightKg: 0.05,
    emissionFactorPerKg: 2,
    preparation:
      "Empty it and rinse it. Leave the paper label on unless your program says otherwise.",
    why: "Steel food cans are a normal metal recyclable. A full can of food is not.",
    environmentalNote:
      "The steel factor in this app is smaller than the aluminum factor because the commonly cited savings are smaller.",
  },
  {
    id: "aluminum-foil",
    name: "Clean aluminum foil",
    keywords: ["aluminum foil", "tin foil", "foil ball"],
    material: "Metal",
    category: "recycle",
    emoji: "🌯",
    weightKg: 0.01,
    emissionFactorPerKg: 9,
    preparation:
      "Wipe off food and ball clean foil together so it can be sorted. Foil covered in cheese or sauce is trash.",
    why: "Clean foil is aluminum. Food-caked foil contaminates the metal and is usually refused.",
    environmentalNote:
      "A foil ball has to be large enough for sorting equipment to see. Tiny clean scraps may still be lost.",
  },
  {
    id: "glass-jar",
    name: "Glass jar",
    keywords: ["glass jar", "jam jar", "sauce jar"],
    material: "Glass",
    category: "recycle",
    emoji: "🍯",
    weightKg: 0.25,
    emissionFactorPerKg: 0.3,
    preparation:
      "Rinse it. Metal lids can often go in loose. Do not include ceramic or drinking glasses.",
    why: "Bottle and jar glass is the glass that recycling programs want. Other glass melts differently.",
    environmentalNote:
      "Glass is heavy, so it shows up in the weight estimate. The emissions factor is intentionally small.",
  },
  {
    id: "glass-bottle",
    name: "Glass bottle",
    keywords: ["glass bottle", "wine bottle", "beer bottle"],
    material: "Glass",
    category: "recycle",
    emoji: "🍾",
    weightKg: 0.35,
    emissionFactorPerKg: 0.3,
    preparation:
      "Empty it. Leave it unbroken if you can, so it stays in the glass stream.",
    why: "Empty glass bottles are a standard recyclable. Broken mixed glass is harder to recover and can be unsafe to handle.",
    environmentalNote:
      "Re-melting bottle glass saves some raw material. This app does not treat that as a precise carbon claim.",
  },
  {
    id: "banana-peel",
    name: "Banana peel",
    keywords: ["banana", "banana peel"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍌",
    weightKg: 0.12,
    preparation:
      "Put peels in the organics bin if you have one. A backyard pile can take them too.",
    why: "Fruit scraps are organic. They do not belong in recycling, where they ruin paper and containers.",
    environmentalNote:
      "This app counts organics toward diverted weight only, not toward the emissions illustration.",
  },
  {
    id: "apple-core",
    name: "Apple core",
    keywords: ["apple core", "apple"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍎",
    weightKg: 0.08,
    preparation: "Food scraps go in the green bin where that program exists.",
    why: "An apple core is food waste. It contaminates recycling and can be composted in organics programs.",
    environmentalNote:
      "Local organics rules differ, especially for a backyard pile versus a city cart.",
  },
  {
    id: "coffee-grounds",
    name: "Coffee grounds",
    keywords: ["coffee grounds", "coffee"],
    material: "Food scraps",
    category: "compost",
    emoji: "☕",
    weightKg: 0.1,
    preparation:
      "Grounds and paper filters can go in organics. Keep plastic pods out.",
    why: "Grounds are food waste. Single-use plastic pods are not compost just because they hold coffee.",
    environmentalNote:
      "A paper filter is often accepted with grounds. A plastic pod is trash or a mail-back item.",
  },
  {
    id: "eggshells",
    name: "Eggshells",
    keywords: ["eggshell", "eggshells", "egg shell"],
    material: "Food scraps",
    category: "compost",
    emoji: "🥚",
    weightKg: 0.04,
    preparation:
      "Shells can go with food scraps in a city organics program or a backyard pile.",
    why: "Eggshells are organic. They are not paper and they are not recycling.",
    environmentalNote:
      "City carts and home piles both usually take shells. Confirm if your program has a short exclusion list.",
  },
  {
    id: "tea-bag",
    name: "Paper tea bag",
    keywords: ["tea bag", "teabag", "tea"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍵",
    weightKg: 0.005,
    preparation:
      "Compost paper tea bags and loose leaves. Cut off staples, strings, and any plastic mesh.",
    why: "The leaves are food waste. Plastic mesh tea bags do not break down in compost.",
    environmentalNote:
      "If you cannot tell whether the bag is plastic, put the leaves in organics and the bag in the trash.",
  },
  {
    id: "paper-napkin",
    name: "Used paper napkin",
    keywords: ["paper napkin", "napkin", "used napkin"],
    material: "Paper",
    category: "compost",
    emoji: "🧻",
    weightKg: 0.008,
    preparation:
      "Food-soiled paper napkins can go in organics only if that program accepts them. Otherwise use the trash.",
    why: "Used napkins are too soiled for recycling. Some green bins take them, and some do not.",
    environmentalNote:
      "This is another item where the material sounds recyclable and the condition says otherwise.",
  },
  {
    id: "yard-trimmings",
    name: "Yard trimmings",
    keywords: ["yard trimmings", "grass", "branches", "yard waste"],
    material: "Yard waste",
    category: "compost",
    emoji: "🌿",
    weightKg: 0.4,
    preparation:
      "Use the green bin or a yard-waste pickup. Keep plastic bags, soil, and pet waste out.",
    why: "Grass, leaves, and small trimmings are the core of organics collection. They are not trash by default where a green bin exists.",
    environmentalNote:
      "Yard waste is often the heaviest organic material a household sets out. Rules on length, bundles, and bags vary.",
  },
  {
    id: "dry-leaves",
    name: "Dry leaves",
    keywords: ["dry leaves", "leaves", "leaf pile"],
    material: "Yard waste",
    category: "compost",
    emoji: "🍂",
    weightKg: 0.2,
    preparation:
      "Put leaves in the organics cart loose or in a paper bag if your city requires bags.",
    why: "Dry leaves are a brown compost ingredient. Plastic bags of leaves are a problem even when the leaves are fine.",
    environmentalNote:
      "In a compost pile, leaves balance wet food scraps. The city may still want them in a specific cart.",
  },
  {
    id: "t-shirt",
    name: "Wearable t-shirt",
    keywords: ["t-shirt", "tshirt", "shirt", "clothing"],
    material: "Textile",
    category: "special",
    emoji: "👕",
    weightKg: 0.18,
    preparation:
      "Donate clean wearable clothes. Do not put textiles in curbside recycling.",
    why: "Clothes tangle machinery and are not a paper, plastic, metal, or glass stream. Donation or a textile program is the better path.",
    environmentalNote:
      "Reuse comes before recycling. A shirt someone else can wear avoids a new one.",
  },
  {
    id: "worn-out-clothes",
    name: "Worn-out clothes",
    keywords: ["worn out clothes", "rag", "damaged clothing"],
    material: "Textile",
    category: "special",
    emoji: "🧦",
    weightKg: 0.2,
    preparation:
      "Look for a textile take-back that accepts damaged clothes. If none exists, the trash is the honest fallback.",
    why: "Damaged textiles still do not belong in the recycling bin. Some collectors want them, and some only want wearable items.",
    environmentalNote:
      "This app marks them as special drop-off and expects you to confirm that a collector actually wants them.",
  },
  {
    id: "aa-battery",
    name: "Household battery",
    keywords: ["battery", "aa battery", "batteries"],
    material: "Battery",
    category: "special",
    emoji: "🔋",
    weightKg: 0.023,
    preparation:
      "Tape the terminals of loose batteries if the drop-off asks, and take them to a battery or hazardous-waste site.",
    why: "Batteries can spark or leak in trucks and sorting lines. They do not belong in recycling, organics, or the trash.",
    environmentalNote:
      "Battery drop-off is about safety as much as materials. This app does not assign an emissions factor.",
  },
  {
    id: "phone",
    name: "Old cell phone",
    keywords: ["cell phone", "phone", "smartphone", "mobile phone"],
    material: "Electronics",
    category: "special",
    emoji: "📱",
    weightKg: 0.17,
    preparation:
      "Erase it if you can, then use an e-waste drop-off, a retailer, or a manufacturer take-back.",
    why: "Phones are electronics, not curbside recycling. They can contain batteries that should stay out of trucks.",
    environmentalNote:
      "E-waste programs recover metals that a city recycling cart is not set up to handle.",
  },
  {
    id: "laptop",
    name: "Laptop",
    keywords: ["laptop", "notebook computer", "computer"],
    material: "Electronics",
    category: "special",
    emoji: "💻",
    weightKg: 1.6,
    preparation:
      "Use a certified e-waste site or a retailer take-back. Delete personal data first if the device still turns on.",
    why: "Computers are electronic waste. They are too complex, and often too hazardous, for a curbside bin.",
    environmentalNote:
      "A laptop dominates a weight estimate because it is heavy. The figure is a typical device weight, not a scale reading.",
  },
  {
    id: "headphones",
    name: "Headphones",
    keywords: ["headphones", "earbuds", "earphones"],
    material: "Electronics",
    category: "special",
    emoji: "🎧",
    weightKg: 0.05,
    preparation:
      "Take small electronics to an e-waste drop-off. Do not hide them in a bag of mixed recycling.",
    why: "Headphones mix plastic, metal, and sometimes a battery. Sorting lines are not built for that mix.",
    environmentalNote:
      "Small devices are easy to toss in the wrong bin. A drop-off is the category this app uses.",
  },
  {
    id: "coffee-cup",
    name: "Lined paper coffee cup",
    keywords: ["coffee cup", "paper cup", "hot cup"],
    material: "Other",
    category: "trash",
    emoji: "☕",
    weightKg: 0.012,
    preparation:
      "Empty it. Unless your city specifically accepts lined cups, put the cup in the trash and check the lid separately.",
    why: "Most hot-drink cups bond paper to a plastic lining. Recycling mills that want plain paper usually refuse them.",
    environmentalNote:
      "A cup that looks like paper is a common contaminant. The lid is often a different plastic.",
  },
  {
    id: "ceramic-plate",
    name: "Broken ceramic plate",
    keywords: ["ceramic", "broken plate", "pottery"],
    material: "Other",
    category: "trash",
    emoji: "🍽️",
    weightKg: 0.4,
    preparation:
      "Wrap the sharp pieces and put them in the trash. Do not mix them with bottle glass.",
    why: "Ceramic, porcelain, and drinking glasses melt at a different temperature from bottle glass and ruin a glass batch.",
    environmentalNote:
      "This is a heavy trash item. Weight in the trash is tracked so it is not mistaken for diverted material.",
  },
  {
    id: "cfl-bulb",
    name: "CFL light bulb",
    keywords: ["cfl", "fluorescent", "light bulb", "curly bulb"],
    material: "Other",
    category: "special",
    emoji: "💡",
    weightKg: 0.09,
    preparation:
      "Keep it intact and take it to a household hazardous waste site. Do not break it into the trash.",
    why: "Compact fluorescent bulbs contain a small amount of mercury. They are not bottle glass and they are not ordinary trash.",
    environmentalNote:
      "LED bulbs are a different product. This entry is only for fluorescent lamps.",
  },
  {
    id: "cooking-oil",
    name: "Used cooking oil",
    keywords: ["cooking oil", "fryer oil", "used oil"],
    material: "Other",
    category: "special",
    emoji: "🛢️",
    weightKg: 0.4,
    preparation:
      "Cool it, seal it, and take it to a used-oil collection site. Do not pour it into a drain or a recycling bin.",
    why: "Oil contaminates water, compost loads, and recyclables. Many cities collect it separately.",
    environmentalNote:
      "A sealed bottle of oil is still a special item. The bottle does not make the oil recyclable.",
  },
  {
    id: "paint-can",
    name: "Latex paint",
    keywords: ["paint", "latex paint", "paint can"],
    material: "Other",
    category: "special",
    emoji: "🎨",
    weightKg: 1,
    preparation:
      "Keep paint in the original can and use a household hazardous waste appointment or drop-off.",
    why: "Liquid paint is hazardous waste, even when it is latex. Dried-out rules, if they exist, come from the local site.",
    environmentalNote:
      "This app does not tell you to dry paint out unless your official instructions say that is allowed.",
  },
  {
    id: "aerosol-can",
    name: "Aerosol can",
    keywords: ["aerosol", "spray can"],
    material: "Other",
    category: "special",
    emoji: "🧴",
    weightKg: 0.08,
    preparation:
      "If the can still sprays or contains product, take it to hazardous waste. Do not puncture it.",
    why: "Pressurized cans can be dangerous in trucks. Some programs accept completely empty metal aerosols, and many want them at a drop-off instead.",
    environmentalNote:
      "Because empty and not-empty cans follow different rules, this app uses special drop-off rather than a blanket recycle label.",
  },
  {
    id: "reusable-bottle",
    name: "Reusable water bottle",
    keywords: ["reusable bottle", "water bottle", "refillable bottle"],
    material: "Other",
    category: "reuse",
    emoji: "🧴",
    weightKg: 0.25,
    preparation:
      "Rinse it and fill it again. Keep using it until it is worn out.",
    why: "A refillable bottle is not trash. Wash it and carry it instead of throwing it away.",
    environmentalNote:
      "Reusing a bottle skips a disposal trip. This app does not count it as recycled material.",
  },
  {
    id: "cloth-bag",
    name: "Cloth shopping bag",
    keywords: ["cloth bag", "tote", "reusable bag", "shopping bag"],
    material: "Textile",
    category: "reuse",
    emoji: "👜",
    weightKg: 0.15,
    preparation:
      "Shake it out and bring it on the next trip. Repair a small tear instead of discarding it.",
    why: "A cloth bag is meant to be used again. It does not belong in the trash while it still carries groceries.",
    environmentalNote:
      "Keeping a bag in use avoids both the trash bin and a new bag.",
  },
  {
    id: "travel-mug",
    name: "Reusable coffee cup",
    keywords: ["travel mug", "reusable cup", "coffee cup", "keep cup"],
    material: "Other",
    category: "reuse",
    emoji: "☕",
    weightKg: 0.3,
    preparation: "Wash the cup and lid, then use them for the next drink.",
    why: "A travel mug is a reusable container, not a disposable cup. Keep it out of the trash.",
    environmentalNote:
      "This entry is for a durable cup you own. A paper takeout cup is a different item.",
  },
  {
    id: "glass-container",
    name: "Glass food container",
    keywords: [
      "glass container",
      "food container",
      "leftover jar",
      "storage container",
    ],
    material: "Glass",
    category: "reuse",
    emoji: "🫙",
    weightKg: 0.4,
    preparation:
      "Wash it and store food in it again. Recycle it only after it breaks, if your city accepts that glass.",
    why: "An intact food container is for keeping, not for the trash. A crack or a chip is when disposal rules start.",
    environmentalNote:
      "This app treats a usable container as reuse. Broken glass follows the recycling or trash rule for that city.",
  },
  {
    id: "cloth-napkin",
    name: "Cloth napkin",
    keywords: ["cloth napkin", "reusable napkin", "napkin"],
    material: "Textile",
    category: "reuse",
    emoji: "🧻",
    weightKg: 0.04,
    preparation: "Wash it with the laundry and set it out again.",
    why: "A cloth napkin is washed and reused. It does not go in the trash after one meal.",
    environmentalNote:
      "Paper napkins are a different item. This entry is only for fabric you keep.",
  },
  {
    id: "cereal-box",
    name: "Cereal box",
    keywords: ["cereal box", "cereal", "cracker box"],
    material: "Cardboard",
    category: "recycle",
    emoji: "🥣",
    weightKg: 0.08,
    emissionFactorPerKg: 1,
    preparation: "Empty it, flatten it, and remove the plastic bag inside.",
    why: "A dry cardboard box is recyclable. The inner plastic liner is not, and it should come out first.",
    environmentalNote:
      "The bag inside a cereal box follows the film rule, not the cardboard rule.",
  },
  {
    id: "paper-towels",
    name: "Paper towels",
    keywords: ["paper towels", "paper towel roll", "kitchen towel"],
    material: "Paper",
    category: "compost",
    emoji: "🧻",
    weightKg: 0.02,
    preparation:
      "Food-soiled paper towels can go in organics only if that program accepts them. Otherwise use the trash.",
    why: "Paper towels are too soiled, and too short-fiber, for recycling. Some green bins take them, and some do not.",
    environmentalNote:
      "A clean unused sheet is still not a recycling item. The cardboard tube is a different entry.",
  },
  {
    id: "tissues",
    name: "Used tissues",
    keywords: ["tissue", "tissues", "facial tissue", "kleenex"],
    material: "Paper",
    category: "trash",
    emoji: "🤧",
    weightKg: 0.004,
    preparation:
      "Put used facial tissues in the trash unless your organics program specifically lists them.",
    why: "Used tissues are soiled paper. Most programs keep them out of recycling, and many keep them out of compost because of germs.",
    environmentalNote:
      "The cardboard tissue box is a different item and can be recycled once it is empty.",
  },
  {
    id: "toilet-paper-roll",
    name: "Toilet paper roll",
    keywords: ["toilet paper roll", "paper tube", "cardboard tube"],
    material: "Cardboard",
    category: "recycle",
    emoji: "🧻",
    weightKg: 0.008,
    emissionFactorPerKg: 1,
    preparation:
      "Recycle the empty cardboard tube. The paper itself is not a recycling item.",
    why: "The brown tube is cardboard. Used toilet paper belongs in the trash or, where allowed, the toilet.",
    environmentalNote:
      "This entry is only the tube. Do not bag used toilet paper into the recycling bin.",
  },
  {
    id: "paper-plates",
    name: "Paper plates",
    keywords: ["paper plate", "paper plates", "coated plate"],
    material: "Paper",
    category: "trash",
    emoji: "🍽️",
    weightKg: 0.015,
    preparation:
      "Scrape leftover food off and put coated or plastic-lined plates in the trash.",
    why: "Most disposable plates have a coating that keeps them out of paper recycling. A plain uncoated plate may be compost where organics accept food-soiled paper.",
    environmentalNote:
      "Grease and a plastic coating are the usual reasons a plate cannot be recycled.",
  },
  {
    id: "paper-bag",
    name: "Paper grocery bag",
    keywords: ["paper bag", "kraft bag", "paper grocery bag"],
    material: "Paper",
    category: "recycle",
    emoji: "🛍️",
    weightKg: 0.04,
    emissionFactorPerKg: 1,
    preparation:
      "Keep it dry and empty. Remove tissue, receipts, and any plastic handles if they come off.",
    why: "A clean paper bag is paper recycling. A bag soaked with food or grease is not.",
    environmentalNote:
      "Plastic grocery bags are a different item and do not go in the recycling bin.",
  },
  {
    id: "envelope",
    name: "Paper envelope",
    keywords: ["paper envelope", "mailing envelope", "window envelope"],
    material: "Paper",
    category: "recycle",
    emoji: "✉️",
    weightKg: 0.006,
    emissionFactorPerKg: 1,
    preparation:
      "Remove a plastic window if your city asks. A paper window can stay.",
    why: "Plain paper envelopes are recyclable. A plastic window is the piece some programs want taken off first.",
    environmentalNote:
      "Padded envelopes with plastic bubble lining are not this item. Those follow the film rule.",
  },
  {
    id: "sticky-notes",
    name: "Sticky notes",
    keywords: ["sticky note", "sticky notes", "post-it"],
    material: "Paper",
    category: "recycle",
    emoji: "📝",
    weightKg: 0.004,
    emissionFactorPerKg: 1,
    preparation:
      "Keep them dry and loose. A stack of clean notes can go with paper.",
    why: "Sticky notes are paper. The adhesive is small enough that many programs accept them with office paper.",
    environmentalNote:
      "Wet or food-covered notes should stay out of the recycling bin.",
  },
  {
    id: "wrapping-paper",
    name: "Gift wrapping paper",
    keywords: ["wrapping paper", "gift wrap", "wrapping"],
    material: "Paper",
    category: "trash",
    emoji: "🎁",
    weightKg: 0.03,
    preparation:
      "Put foil, glitter, or plastic-coated wrap in the trash. Only plain uncoated paper has a chance in recycling.",
    why: "Most gift wrap is mixed with foil, glitter, or a plastic coating, so it is not ordinary paper recycling.",
    environmentalNote:
      "A brown kraft sheet with no coating is closer to a paper bag than to decorated gift wrap.",
  },
  {
    id: "shampoo-bottle",
    name: "Shampoo bottle",
    keywords: ["shampoo bottle", "shampoo", "empty shampoo"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧴",
    weightKg: 0.04,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it and rinse it. Put the cap back on if your city flyer says caps stay on.",
    why: "An empty rigid shampoo bottle is a common curbside plastic. A full bottle is not.",
    environmentalNote:
      "The pump on some bottles is a different plastic. Leave it on only if your program says to.",
  },
  {
    id: "conditioner-bottle",
    name: "Conditioner bottle",
    keywords: ["conditioner bottle", "conditioner", "empty conditioner"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧴",
    weightKg: 0.04,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it and rinse it. Follow the same cap rule as your other bottles.",
    why: "Conditioner bottles are the same kind of rigid plastic as shampoo bottles, and they need to be empty.",
    environmentalNote:
      "A bottle still full of product is not a recycling item.",
  },
  {
    id: "ziploc-bag",
    name: "Ziploc bag",
    keywords: ["ziploc", "ziploc bag", "resealable bag", "sandwich bag"],
    material: "Plastic",
    category: "special",
    emoji: "🥪",
    weightKg: 0.004,
    preparation:
      "If it is clean and dry, add it to a store film take-back. A bag with food on it goes in the trash.",
    why: "Resealable bags are film, not a bottle or tub. Loose film tangles sorting machines, so it stays out of curbside recycling.",
    environmentalNote:
      "Only a clean, dry bag belongs in film take-back. Crumbs and grease make it trash.",
  },
  {
    id: "plastic-food-container",
    name: "Plastic food container",
    keywords: ["plastic food container", "leftover tub", "deli container"],
    material: "Plastic",
    category: "recycle",
    emoji: "🥡",
    weightKg: 0.03,
    emissionFactorPerKg: 1.5,
    preparation:
      "Scrape or rinse it, and check whether your city accepts tubs as well as bottles.",
    why: "Rigid food containers are accepted in many programs and refused in others. A resin number by itself does not decide.",
    environmentalNote:
      "Black plastic and thin takeout boxes are less widely accepted than a clear tub.",
  },
  {
    id: "bottle-cap",
    name: "Plastic bottle cap",
    keywords: ["bottle cap", "plastic cap", "plastic lid"],
    material: "Plastic",
    category: "recycle",
    emoji: "🔘",
    weightKg: 0.002,
    emissionFactorPerKg: 1.5,
    preparation:
      "Screw the cap back onto an empty bottle. A loose cap is too small for the sorting line.",
    why: "Caps are recyclable plastic when they stay with the bottle. On their own they fall through the screens.",
    environmentalNote:
      "Metal caps are a different item. This entry is the plastic cap from a drink bottle.",
  },
  {
    id: "takeout-container",
    name: "Plastic takeout container",
    keywords: ["takeout container", "takeout box", "plastic clamshell"],
    material: "Plastic",
    category: "recycle",
    emoji: "🥡",
    weightKg: 0.025,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it and rinse it. Check the local list, especially for black plastic.",
    why: "A clear rigid takeout box is often accepted. Black plastic and foam boxes often are not.",
    environmentalNote:
      "A foam takeout box is the foam cup entry, not this one.",
  },
  {
    id: "bubble-wrap",
    name: "Bubble wrap",
    keywords: ["bubble wrap", "bubblewrap", "air pillows"],
    material: "Plastic",
    category: "special",
    emoji: "📦",
    weightKg: 0.01,
    preparation:
      "Deflate clean, dry wrap and take it to a store film drop-off. Do not put it loose in curbside recycling.",
    why: "Bubble wrap is plastic film. It tangles sorting equipment the same way grocery bags do.",
    environmentalNote:
      "Dirty wrap, or wrap stuck to tape and labels, belongs in the trash.",
  },
  {
    id: "plastic-packaging",
    name: "Soft plastic packaging",
    keywords: ["plastic packaging", "soft plastic", "product wrap"],
    material: "Plastic",
    category: "special",
    emoji: "🎁",
    weightKg: 0.008,
    preparation:
      "Clean, dry film can go to a store take-back. Food-covered or crumbly packaging goes in the trash.",
    why: "Soft packaging is film, not a rigid container. Curbside bins are not set up to sort it.",
    environmentalNote:
      "A rigid bottle or tub is a different item. This entry is the flexible wrap around a product.",
  },
  {
    id: "orange-peel",
    name: "Orange peel",
    keywords: ["orange peel", "orange peels", "citrus peel"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍊",
    weightKg: 0.08,
    preparation:
      "Put peels in the organics bin if you have one. A backyard pile can take them too.",
    why: "Citrus peels are food scraps. They do not belong in recycling.",
    environmentalNote:
      "Stickers on the peel should come off if you can, because the sticker is not food.",
  },
  {
    id: "potato-peels",
    name: "Potato peels",
    keywords: ["potato peel", "potato peels", "potato skin"],
    material: "Food scraps",
    category: "compost",
    emoji: "🥔",
    weightKg: 0.1,
    preparation: "Food scraps go in the green bin where that program exists.",
    why: "Vegetable peels are organic. They contaminate paper and containers if they go in recycling.",
    environmentalNote:
      "City carts and home piles both usually take vegetable peels.",
  },
  {
    id: "carrot-peels",
    name: "Carrot peels",
    keywords: ["carrot peel", "carrot peels", "carrot tops"],
    material: "Food scraps",
    category: "compost",
    emoji: "🥕",
    weightKg: 0.06,
    preparation: "Put peels and tops in the organics bin or a backyard pile.",
    why: "Carrot scraps are food waste, not trash by default where a green bin exists.",
    environmentalNote:
      "Rubber bands and produce stickers should stay out of the organics.",
  },
  {
    id: "lettuce-scraps",
    name: "Lettuce scraps",
    keywords: ["lettuce", "lettuce scraps", "salad scraps"],
    material: "Food scraps",
    category: "compost",
    emoji: "🥬",
    weightKg: 0.08,
    preparation:
      "Put leftover leaves in the organics bin. Keep plastic bags and dressing containers out.",
    why: "Lettuce is food waste. The bag it came in is a different item.",
    environmentalNote: "Wilted leaves compost the same way fresh scraps do.",
  },
  {
    id: "bread-crusts",
    name: "Bread crusts",
    keywords: ["bread crust", "bread crusts", "bread", "leftover bread"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍞",
    weightKg: 0.04,
    preparation:
      "Put stale bread and crusts in the organics bin. Do not wrap them in plastic first.",
    why: "Bread is food waste. It does not belong in recycling, and it molds in the trash.",
    environmentalNote: "A plastic bread bag is film, not compost.",
  },
  {
    id: "rice-leftovers",
    name: "Leftover rice",
    keywords: ["leftover rice", "rice", "rice leftovers"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍚",
    weightKg: 0.15,
    preparation:
      "Scrape rice into the organics bin. Rinse the container and sort that container on its own.",
    why: "Cooked rice is food waste. The box or tub it came in is a separate decision.",
    environmentalNote:
      "City organics programs usually take cooked grains. A backyard pile may attract animals, so follow that pile’s rules.",
  },
  {
    id: "pasta-leftovers",
    name: "Leftover pasta",
    keywords: ["leftover pasta", "pasta", "noodles"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍝",
    weightKg: 0.15,
    preparation:
      "Scrape pasta and sauce into the organics bin if you have one.",
    why: "Pasta is food waste. Sauce-covered cardboard or plastic still has to be sorted as its own item.",
    environmentalNote:
      "Meat sauce follows the same organics rule as the pasta when the city cart accepts food scraps.",
  },
  {
    id: "vegetable-scraps",
    name: "Vegetable scraps",
    keywords: ["vegetable scraps", "veggie scraps", "vegetable peels"],
    material: "Food scraps",
    category: "compost",
    emoji: "🥦",
    weightKg: 0.12,
    preparation:
      "Put stems, ends, and peels in the organics bin or a backyard pile.",
    why: "Vegetable scraps are the core of a food-waste program. They ruin recycling when they are mixed in.",
    environmentalNote:
      "This entry covers mixed vegetable scraps. A single peel, such as potato or carrot, also has its own entry.",
  },
  {
    id: "fruit-scraps",
    name: "Fruit scraps",
    keywords: ["fruit scraps", "fruit peels", "fruit waste"],
    material: "Food scraps",
    category: "compost",
    emoji: "🍇",
    weightKg: 0.12,
    preparation:
      "Put peels, cores, and rinds in the organics bin. Remove produce stickers if you can.",
    why: "Fruit scraps are food waste. They do not belong in the recycling bin.",
    environmentalNote:
      "Banana peels, apple cores, and orange peels are specific entries of the same kind of waste.",
  },
  {
    id: "spoiled-food",
    name: "Spoiled food",
    keywords: ["spoiled food", "rotten food", "expired food"],
    material: "Food scraps",
    category: "compost",
    emoji: "🗑️",
    weightKg: 0.3,
    preparation:
      "Put spoiled food in the organics bin, still out of its plastic packaging. Check whether your city accepts meat and dairy.",
    why: "Spoiled food is organic waste. The package around it is not, and it has to come off first.",
    environmentalNote:
      "Backyard piles often skip meat, dairy, and oily food even when a city green cart takes them.",
  },
  {
    id: "metal-bottle-cap",
    name: "Metal bottle cap",
    keywords: ["metal bottle cap", "crown cap", "bottle cap metal"],
    material: "Metal",
    category: "recycle",
    emoji: "🍾",
    weightKg: 0.004,
    emissionFactorPerKg: 2,
    preparation:
      "Collect caps with other metal, or drop them into a steel can so they are large enough to sort.",
    why: "A metal crown cap is steel. Loose caps are small, so they sort more reliably inside a can than on their own.",
    environmentalNote:
      "Plastic caps belong back on a plastic bottle. This entry is the metal cap from a glass bottle.",
  },
  {
    id: "can-lid",
    name: "Food can lid",
    keywords: ["can lid", "food can lid", "tin lid"],
    material: "Metal",
    category: "recycle",
    emoji: "🥫",
    weightKg: 0.008,
    emissionFactorPerKg: 2,
    preparation:
      "Push the lid into the empty can or leave it attached, then rinse the can.",
    why: "The lid is the same metal as the can. A sharp loose lid is harder to sort and less safe to handle.",
    environmentalNote:
      "The can itself is the steel food can entry. This entry is the separated lid.",
  },
  {
    id: "tin-container",
    name: "Tin container",
    keywords: ["tin container", "cookie tin", "metal tin"],
    material: "Metal",
    category: "recycle",
    emoji: "🍪",
    weightKg: 0.15,
    emissionFactorPerKg: 2,
    preparation:
      "Empty it and rinse it if it held food. Leave it uncrushed if the lid still fits.",
    why: "A steel cookie tin or biscuit tin is metal recycling, the same family as a food can.",
    environmentalNote:
      "Decorative tins with a thick plastic liner should have that liner removed first.",
  },
  {
    id: "aluminum-tray",
    name: "Aluminum tray",
    keywords: ["aluminum tray", "foil tray", "roasting tray", "takeout tray"],
    material: "Metal",
    category: "recycle",
    emoji: "🍱",
    weightKg: 0.02,
    emissionFactorPerKg: 9,
    preparation:
      "Wipe off food and rinse a clean tray. A tray caked with grease or cheese is trash.",
    why: "A clean aluminum tray is the same metal as foil. Food left on it contaminates the metal.",
    environmentalNote:
      "Ball a few clean trays together if they are flimsy, so the sorting line can see them.",
  },
  {
    id: "toothpaste-tube",
    name: "Toothpaste tube",
    keywords: ["toothpaste", "toothpaste tube"],
    material: "Other",
    category: "trash",
    emoji: "🪥",
    weightKg: 0.02,
    preparation:
      "Squeeze it empty and put the tube in the trash unless a printed take-back program lists it.",
    why: "Most toothpaste tubes mix plastic and metal, so curbside programs do not sort them with bottles.",
    environmentalNote:
      "A special mail-back, if the brand offers one, is the only path besides the trash.",
  },
  {
    id: "toothbrush",
    name: "Toothbrush",
    keywords: ["toothbrush", "old toothbrush"],
    material: "Plastic",
    category: "trash",
    emoji: "🪥",
    weightKg: 0.008,
    preparation:
      "Put a worn-out toothbrush in the trash unless a brand take-back accepts it.",
    why: "A toothbrush is small mixed plastic. It is not a bottle, and it falls through recycling screens.",
    environmentalNote:
      "An electric toothbrush with a battery is electronics, not this entry.",
  },
  {
    id: "soap-dispenser",
    name: "Empty soap dispenser",
    keywords: ["soap dispenser", "soap pump", "empty soap bottle"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧼",
    weightKg: 0.05,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty and rinse the bottle. Remove the pump if your program only wants the bottle.",
    why: "The bottle is rigid plastic. The pump often mixes materials and is the piece some cities refuse.",
    environmentalNote:
      "A dispenser that still contains soap should be emptied before it is recycled.",
  },
  {
    id: "cotton-swabs",
    name: "Cotton swabs",
    keywords: ["cotton swab", "cotton swabs", "q-tip", "qtip"],
    material: "Other",
    category: "trash",
    emoji: "👂",
    weightKg: 0.002,
    preparation: "Put swabs in the trash. Do not flush them.",
    why: "Swab sticks are plastic or tightly wound paper, and they are too small for recycling. Flushing them clogs pipes.",
    environmentalNote:
      "The cotton tip does not make the swab compostable when the stick is plastic.",
  },
  {
    id: "cotton-balls",
    name: "Cotton balls",
    keywords: ["cotton ball", "cotton balls"],
    material: "Other",
    category: "trash",
    emoji: "☁️",
    weightKg: 0.003,
    preparation:
      "Put used cotton balls in the trash unless they are 100% cotton and your organics program lists them.",
    why: "Used cotton balls are often soiled, and many are blended with synthetic fiber. Recycling does not take them.",
    environmentalNote:
      "Makeup, medicine, and nail polish on a cotton ball keep it out of compost.",
  },
  {
    id: "dental-floss",
    name: "Dental floss",
    keywords: ["dental floss", "floss", "floss picks"],
    material: "Plastic",
    category: "trash",
    emoji: "🧵",
    weightKg: 0.002,
    preparation:
      "Put used floss and plastic floss picks in the trash. Do not flush them.",
    why: "Floss is a thin plastic string. It tangles equipment and is not a recycling item.",
    environmentalNote:
      "The small plastic case, if it is rigid and empty, can be checked against the bottle rules. The floss itself is trash.",
  },
  {
    id: "deodorant",
    name: "Deodorant container",
    keywords: ["deodorant", "deodorant container", "empty deodorant"],
    material: "Other",
    category: "trash",
    emoji: "🧴",
    weightKg: 0.03,
    preparation:
      "Use it up and put the empty container in the trash unless the brand runs a take-back.",
    why: "Deodorant sticks mix plastic, leftover product, and sometimes a metal dial. Curbside programs usually refuse them.",
    environmentalNote:
      "An empty plastic cap by itself is not enough to recycle the whole stick.",
  },
  {
    id: "tissue-box",
    name: "Tissue box",
    keywords: ["tissue box", "kleenex box"],
    material: "Cardboard",
    category: "recycle",
    emoji: "📦",
    weightKg: 0.04,
    emissionFactorPerKg: 1,
    preparation:
      "Empty it and remove the plastic film or window if your program asks.",
    why: "The box is cardboard. The tissues that were inside are a different item.",
    environmentalNote:
      "A plastic opening window should come off when the city flyer says so.",
  },
  {
    id: "lotion-bottle",
    name: "Lotion bottle",
    keywords: ["lotion bottle", "lotion", "empty lotion"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧴",
    weightKg: 0.04,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty it as well as you can and rinse it. Replace the cap if your program wants caps on.",
    why: "An empty rigid lotion bottle is the same kind of plastic as a shampoo bottle.",
    environmentalNote:
      "A pump that does not come clean can be removed and put in the trash.",
  },
  {
    id: "hairbrush",
    name: "Hairbrush",
    keywords: ["hairbrush", "hair brush", "comb"],
    material: "Plastic",
    category: "trash",
    emoji: "💇",
    weightKg: 0.05,
    preparation: "Pull out loose hair and put the brush in the trash.",
    why: "Brushes and combs mix plastic, rubber pads, and sometimes metal pins. They are not a bottle or tub.",
    environmentalNote: "Hair left in the brush does not make it compost.",
  },
  {
    id: "disposable-razor",
    name: "Disposable razor",
    keywords: ["disposable razor", "razor", "plastic razor"],
    material: "Other",
    category: "trash",
    emoji: "🪒",
    weightKg: 0.008,
    preparation:
      "Cap the blade if you can and put the razor in the trash. Do not drop it loose into recycling.",
    why: "A disposable razor mixes a blade with plastic. It is unsafe in a recycling bin and is not a target material.",
    environmentalNote:
      "A razor with a battery is electronics and should go to a battery or e-waste drop-off instead.",
  },
  {
    id: "makeup-packaging",
    name: "Makeup packaging",
    keywords: ["makeup packaging", "makeup", "cosmetic container", "mascara"],
    material: "Other",
    category: "trash",
    emoji: "💄",
    weightKg: 0.02,
    preparation:
      "Empty what you can and put mixed cosmetic packaging in the trash unless a store take-back lists it.",
    why: "Compacts, mascara tubes, and pumps mix materials and leftover product. Curbside programs usually refuse them.",
    environmentalNote:
      "A simple empty plastic bottle, such as lotion, is a different entry.",
  },
  {
    id: "toilet-paper-pack",
    name: "Toilet paper packaging",
    keywords: [
      "toilet paper packaging",
      "toilet paper wrap",
      "paper packaging film",
    ],
    material: "Plastic",
    category: "special",
    emoji: "🛍️",
    weightKg: 0.01,
    preparation:
      "If the wrap is clean and dry, take it to a store film drop-off. Otherwise use the trash.",
    why: "The wrap around a toilet paper pack is plastic film. It does not go in curbside recycling.",
    environmentalNote:
      "The cardboard tube inside each roll is the toilet paper roll entry.",
  },
  {
    id: "cleaning-bottle",
    name: "Cleaning product bottle",
    keywords: [
      "cleaning bottle",
      "cleaner bottle",
      "spray bottle",
      "empty cleaner",
    ],
    material: "Plastic",
    category: "recycle",
    emoji: "🧽",
    weightKg: 0.06,
    emissionFactorPerKg: 1.5,
    preparation:
      "Use it up, rinse it, and recycle the rigid bottle. Do not recycle a bottle that still holds hazardous cleaner.",
    why: "An empty, rinsed cleaner bottle is rigid plastic. Product left inside can make it hazardous waste instead.",
    environmentalNote:
      "The trigger sprayer is often a different plastic. Remove it if your program says the bottle only.",
  },
  {
    id: "light-bulb",
    name: "Broken light bulb",
    keywords: ["incandescent bulb", "led bulb", "broken bulb", "lightbulb"],
    material: "Other",
    category: "trash",
    emoji: "💡",
    weightKg: 0.03,
    preparation:
      "Wrap a broken incandescent or LED bulb so the glass is covered, then put it in the trash. Do not mix it with bottle glass.",
    why: "Ordinary bulbs are the wrong glass for recycling, and a broken one is a handling hazard. Fluorescent bulbs are a different item because they contain mercury.",
    environmentalNote:
      "Some retailers take intact LEDs. A CFL or fluorescent tube still needs a hazardous-waste site.",
  },
  {
    id: "phone-charger",
    name: "Phone charger",
    keywords: ["phone charger", "charger", "charging cable", "usb cable"],
    material: "Electronics",
    category: "special",
    emoji: "🔌",
    weightKg: 0.05,
    preparation:
      "Take cables and chargers to an e-waste drop-off or a retailer take-back.",
    why: "Chargers are electronics. They tangle machinery and do not belong in curbside recycling or the trash.",
    environmentalNote:
      "A cable looks like plastic, but the copper and the plug are why it has a separate drop-off.",
  },
  {
    id: "printer-cartridge",
    name: "Printer cartridge",
    keywords: ["printer cartridge", "ink cartridge", "toner"],
    material: "Other",
    category: "special",
    emoji: "🖨️",
    weightKg: 0.3,
    preparation:
      "Bag it so leftover ink stays contained, then use a store, manufacturer, or office take-back.",
    why: "Ink and toner cartridges are not curbside recycling. Leftover ink can spill in a truck.",
    environmentalNote:
      "Many office-supply stores take empty cartridges. The trash is the fallback only when no take-back exists.",
  },
  {
    id: "pen",
    name: "Old pen",
    keywords: ["pen", "ballpoint", "old pen"],
    material: "Plastic",
    category: "trash",
    emoji: "🖊️",
    weightKg: 0.008,
    preparation:
      "Put dried-out pens in the trash unless a stationery take-back lists them.",
    why: "A pen is small mixed plastic and metal. It falls through recycling screens.",
    environmentalNote:
      "A refill that still writes can stay in use. This entry is a pen you are done with.",
  },
  {
    id: "pencil",
    name: "Broken pencil",
    keywords: ["pencil", "broken pencil", "wood pencil"],
    material: "Other",
    category: "trash",
    emoji: "✏️",
    weightKg: 0.005,
    preparation:
      "Put a broken pencil in the trash. The graphite, paint, and eraser keep it out of paper recycling.",
    why: "A pencil is wood plus graphite, paint, and a metal ferrule. It is not paper and it is not a compost pile’s brown material.",
    environmentalNote:
      "A stub that still writes can be used. This entry is one that is finished.",
  },
  {
    id: "old-socks",
    name: "Old socks",
    keywords: ["old socks", "socks", "single sock"],
    material: "Textile",
    category: "special",
    emoji: "🧦",
    weightKg: 0.04,
    preparation:
      "Look for a textile take-back that accepts worn socks. If none exists, the trash is the honest fallback.",
    why: "Socks do not belong in curbside recycling. Some textile collectors want them even when they are worn out, and some do not.",
    environmentalNote:
      "A sock with no holes can be donated or kept. This entry is one you are discarding.",
  },
  {
    id: "worn-shoes",
    name: "Worn-out shoes",
    keywords: ["worn-out shoes", "old shoes", "sneakers", "shoes"],
    material: "Textile",
    category: "special",
    emoji: "👟",
    weightKg: 0.4,
    preparation:
      "Donate shoes that someone can still wear. For worn-out pairs, use a shoe or textile take-back if one is nearby.",
    why: "Shoes mix fabric, rubber, and foam. They tangle recycling equipment and are not a paper or plastic stream.",
    environmentalNote:
      "A wearable pair is reuse. This entry is a pair that is used up.",
  },
  {
    id: "broken-toy",
    name: "Broken toy",
    keywords: ["broken toy", "toy", "plastic toy"],
    material: "Plastic",
    category: "trash",
    emoji: "🧸",
    weightKg: 0.15,
    preparation:
      "If it still works, give it away. A broken plastic toy with no battery goes in the trash.",
    why: "Mixed plastic toys are not curbside recycling. A toy with batteries or a plug is electronics and needs a drop-off.",
    environmentalNote:
      "Remove batteries before the rest of the toy is discarded.",
  },
  {
    id: "notebook",
    name: "Old notebook",
    keywords: ["notebook", "old notebook", "spiral notebook"],
    material: "Paper",
    category: "recycle",
    emoji: "📓",
    weightKg: 0.15,
    emissionFactorPerKg: 1,
    preparation:
      "Remove the metal spiral if your program asks, then recycle the paper pages.",
    why: "Notebook paper is office paper. The spiral is metal and can be recycled with cans once it is off the paper.",
    environmentalNote:
      "A notebook with a plastic cover should have that cover checked separately. The pages are paper.",
  },
  {
    id: "used-candle",
    name: "Used candle",
    keywords: ["used candle", "candle", "candle wax"],
    material: "Other",
    category: "trash",
    emoji: "🕯️",
    weightKg: 0.08,
    preparation:
      "Let the wax cool, then put leftover wax and a non-recyclable jar in the trash. A glass jar that is wax-free can be recycled.",
    why: "Wax is not paper, plastic, or compost. A jar still coated in wax contaminates glass recycling.",
    environmentalNote:
      "Scrape the jar clean if you want to recycle the glass. The wax itself is trash.",
  },
  {
    id: "plastic-hanger",
    name: "Plastic hanger",
    keywords: ["plastic hanger", "clothes hanger", "hanger"],
    material: "Plastic",
    category: "trash",
    emoji: "👕",
    weightKg: 0.02,
    preparation:
      "Return it to a dry cleaner that accepts hangers, or put a broken one in the trash. Do not put it in curbside recycling.",
    why: "Hangers jam sorting machinery. They are the wrong shape even when the plastic itself is common.",
    environmentalNote:
      "A store that hands hangers back out is reuse. A cracked hanger has no recycling bin.",
  },
  {
    id: "sponge",
    name: "Old sponge",
    keywords: ["sponge", "old sponge", "kitchen sponge"],
    material: "Other",
    category: "trash",
    emoji: "🧽",
    weightKg: 0.015,
    preparation: "Wring it out and put it in the trash.",
    why: "Sponges mix foam, fiber, and food residue. They are not recycling and they are not yard waste.",
    environmentalNote:
      "A worn sponge is a trash item. A dishcloth you can still wash is a different entry.",
  },
  {
    id: "dishcloth",
    name: "Used dishcloth",
    keywords: ["dishcloth", "dish cloth", "used dishcloth"],
    material: "Textile",
    category: "reuse",
    emoji: "🧺",
    weightKg: 0.04,
    preparation:
      "Wash it and use it again. When it is worn through, look for a textile take-back before using the trash.",
    why: "A dishcloth is meant to be washed and kept. It does not belong in the trash after one use.",
    environmentalNote:
      "A sponge is a different item. This entry is fabric you can launder.",
  },
  {
    id: "plastic-bucket",
    name: "Plastic bucket",
    keywords: ["plastic bucket", "bucket", "hdpe bucket"],
    material: "Plastic",
    category: "recycle",
    emoji: "🪣",
    weightKg: 0.3,
    emissionFactorPerKg: 1.5,
    preparation:
      "Empty and rinse it. Recycle it only if it fits in the cart and your city accepts bulky rigid plastic.",
    why: "A bucket is rigid plastic, often HDPE. Some carts take it, and some only take bottles and jugs.",
    environmentalNote:
      "A bucket you can still carry things in is better kept than recycled.",
  },
  {
    id: "calendar",
    name: "Old calendar",
    keywords: ["calendar", "old calendar", "wall calendar"],
    material: "Paper",
    category: "recycle",
    emoji: "📅",
    weightKg: 0.1,
    emissionFactorPerKg: 1,
    preparation:
      "Remove metal spirals, plastic overlays, and any foil decoration, then recycle the paper.",
    why: "Calendar pages are paper. Spiral bindings and plastic sheets are not part of that paper.",
    environmentalNote:
      "A foil or glitter cover should be torn off before the paper pages go in the bin.",
  },
  {
    id: "detergent-bottle",
    name: "Detergent bottle",
    keywords: ["detergent bottle", "laundry detergent", "empty detergent"],
    material: "Plastic",
    category: "recycle",
    emoji: "🧴",
    weightKg: 0.08,
    emissionFactorPerKg: 1.5,
    preparation:
      "Use it up, rinse it, and put the cap back on if your program asks for caps on.",
    why: "Laundry detergent bottles are a common rigid plastic, usually HDPE, once they are empty.",
    environmentalNote:
      "Detergent pods and their soft film bag are not this bottle. Film goes to a store take-back or the trash.",
  },
  {
    id: "small-appliance",
    name: "Small appliance",
    keywords: ["small appliance", "toaster", "blender", "broken appliance"],
    material: "Electronics",
    category: "special",
    emoji: "🍞",
    weightKg: 1.2,
    preparation:
      "Unplug it and take it to an e-waste or appliance drop-off. Do not set it in the curbside bin.",
    why: "Toasters, blenders, and similar appliances mix metal, plastic, and cords. They are electronic waste.",
    environmentalNote:
      "A working appliance can be given away. This entry is one that is broken.",
  },
  {
    id: "phone-case",
    name: "Phone case",
    keywords: ["phone case", "old phone case", "silicone case"],
    material: "Plastic",
    category: "trash",
    emoji: "📱",
    weightKg: 0.02,
    preparation: "Put a worn-out plastic or silicone case in the trash.",
    why: "Phone cases are mixed or flexible plastic, not a bottle. Curbside programs do not sort them.",
    environmentalNote:
      "The phone itself is electronics and has its own drop-off. This entry is only the case.",
  },
  {
    id: "expired-makeup",
    name: "Expired makeup",
    keywords: ["expired makeup", "old makeup", "lipstick"],
    material: "Other",
    category: "trash",
    emoji: "💄",
    weightKg: 0.03,
    preparation:
      "Keep liquids sealed so they do not leak, then put expired makeup in the trash.",
    why: "Expired makeup is product, not a recyclable material. The packaging is usually too mixed to sort.",
    environmentalNote:
      "A store cosmetic take-back, if one exists nearby, is the alternative to the trash.",
  },
  {
    id: "disposable-gloves",
    name: "Disposable gloves",
    keywords: [
      "disposable gloves",
      "latex gloves",
      "nitrile gloves",
      "used gloves",
    ],
    material: "Plastic",
    category: "trash",
    emoji: "🧤",
    weightKg: 0.008,
    preparation:
      "Put used disposable gloves in the trash. Do not recycle them and do not compost them.",
    why: "Gloves are contaminated film. They tangle sorting lines and do not belong in organics.",
    environmentalNote:
      "Medical or chemical contamination can make gloves a special waste. Household cleaning gloves are trash.",
  },
];

const byId = new Map(WASTE_ITEMS.map((item) => [item.id, item]));

export function getItem(id: string) {
  return byId.get(id);
}

export function hintFromFilename(filename: string) {
  const base = filename
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .replace(/[_-]+/g, " ");
  let bestScore = 0;
  let matches: WasteItem[] = [];
  for (const item of WASTE_ITEMS) {
    let score = 0;
    for (const phrase of [item.name, ...item.keywords]) {
      const normalized = phrase.toLowerCase();
      if (normalized.length < 4) continue;
      if (base.includes(normalized)) score = Math.max(score, normalized.length);
    }
    if (score > bestScore) {
      bestScore = score;
      matches = [item];
    } else if (score === bestScore && score > 0) {
      matches.push(item);
    }
  }
  return matches.length === 1 ? matches[0] : null;
}
