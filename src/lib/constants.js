export const defaultRecipe = {
  id: null, name: "", method: "Pour Over", brewer: "", filterPaper: "",
  dose: "", water: "", temperature: "", grindSize: "",
  bloomWater: "", bloomTime: "", numPours: "", totalTime: "",
  pours: [], pourStructure: "",
  archived: false,
  machine: "", grinder: "", preHeat: "", preInfusionTime: "", preInfusionBar: "", maxPressureBar: "", maxPressureUntilG: "", finishPressureBar: "", shotYield: "", brewTime: "",
};

export const processOptions = ["Natural", "Washed", "Honey", "Anaerobic", "Co-fermented", "Wet-hulled", "Other"];
export const roastLevels = ["Light", "Medium-Light", "Medium", "Medium-Dark", "Dark"];
export const varietalOptions = ["Sidra", "Gesha/Geisha", "Bourbon", "Typica", "Caturra", "SL28", "SL34", "Pacamara", "Catuai", "Heirloom", "Unknown/Blend"];
export const beanTypes = ["Filter", "Espresso"];
export const altitudeOptions = ["<1200m", "1200–1500m", "1500–1800m", "1800–2100m", ">2100m"];

export const defaultBean = {
  id: null, name: "", roaster: "", origin: "", region: "",
  producer: "",
  process: "", roastLevel: "", varietal: "", altitude: "", type: "", roastDate: "", notes: "",
  archived: false,
  brews: [],
  roasts: [],
};

export const defaultGreenBeanRoast = {
  id: null,
  date: new Date().toISOString().split("T")[0],
  roastTime: new Date().toTimeString().slice(0, 5),
  profile: "",
  roastLevel: "Medium",
  restingFromDays: "",
  restingToDays: "",
  firstCrack: "",
  totalRoast: "",
  startWeight: "",
  endWeight: "",
  reductionPercent: "",
  notes: "",
};

export const brewMethods = ["Pour Over", "Espresso"];
export const preHeatOptions = ["None", "Low", "Medium", "Hot"];
export const pourOverBrewers = ["V60", "Chemex", "Kalita Wave", "Origami", "Aeropress", "Clever Dripper", "Other"];
export const filterPapers = ["Hario Tabbed (white)", "Hario Tabbed (natural)", "Hario Untabbed", "Chemex Bonded", "Kalita Wave", "Bleached", "Unbleached", "Metal filter", "Cloth filter", "Other"];

export const VIEW_KEYS = {
  BEANS: "beans",
  BEAN_FORM: "beanForm",
  BEAN_DETAIL: "beanDetail",
  BREW_FORM: "brewForm",
  GREEN_BEAN_ROAST_FORM: "greenBeanRoastForm",
  ROAST_PROFILE_FORM: "roastProfileForm",
  RECIPE_FORM: "recipeForm",
};

export const TAB_KEYS = {
  BEANS: "beans",
  GREEN_BEANS: "greenBeans",
  ROAST_PROFILES: "roastProfiles",
  RECIPES: "recipes",
  BREWS: "brews",
};

export const defaultBrew = {
  id: null, date: new Date().toISOString().split("T")[0],
  method: "Pour Over", brewer: "", filterPaper: "",
  dose: "", water: "", temperature: "", grindSize: "",
  bloomWater: "", bloomTime: "", numPours: "", totalTime: "",
  pours: [], pourStructure: "", rating: 0, tastingNotes: "",
  recipeSource: "Manual", recipeName: "",
  // Espresso fields
  machine: "", grinder: "", preHeat: "", preInfusionTime: "", preInfusionBar: "", maxPressureBar: "", maxPressureUntilG: "", finishPressureBar: "", shotYield: "", brewTime: "",
};
