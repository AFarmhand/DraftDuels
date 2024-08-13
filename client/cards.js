class Card {
    constructor(name = 'Card', rarity = '0', playerInteractions = {}, opponentInteractions = {}) {
        this.name = name;
        this.rarity = rarity;
        this.playerInteractions = playerInteractions;
        this.opponentInteractions = opponentInteractions;
    }
}

var blankcard = new Card('blankcard', 0,
    // blank card created to replace played cards when cancel is put into play
    { 'base' : {}
    },
    { 'base' : {}
    }
);

/************************************************************************
     Nature Cards
    Focused around building and using sunlight for powerful actions
***********************************************************************/
var sereneforest = new Card("sereneforest", 1,  
    // heal 4 hp, gain 2 sunlight
    //ForestToYou
    {
        'lumberjack' : {hp : 4},
        'base'  : {hp : 4, 'sunlight' : 2}
    }, 
    //ForestToThem
    {
        'base' : {}
    }
);

var airstrike = new Card('airstrike', 1,
    //airstriketoyou deal 4 dmg gain 2 sunlight
    {
        'lumberjack' : {},
        'base' : {'sunlight' : 2}
    },
    //airstriketothem
    {
        'shield' : {},
        'base' : {'hp' : -4}
    }
);

var freshair = new Card('freshair', 1,
    //freshairtoyou 4 sunlight
    {
        'lumberjack' : {},
        'base' : {'sunlight' : 4}
    },
    //freshairtothem
    {
        'base' : {}
    }
);

var herbalremedy = new Card('herbalremedy', 2,
    //herbtoyou heal 3 x sunlight hp, use 2 sunlight
    {
        'base' : {'HPxSunlight' : 3, 'sunlight' : -2}
    },
    //herbtothem
    {
        'base' : {}
    }
);

var stampede = new Card('stampede', 2,
    //stampede to them deal 3 x sunlight dmg, consume 2 sunlight
    {
        'base' : {'sunlight' : -2}
    },
    //stampede to them
    {
        'shield' : {},
        'base' : {'DMGxSunlight' : -3} 
    }
);

var elephant = new Card('elephant', 3,
    //elephanttoyou full heal if 10 sunlight, use 10 sunlight : otherwise deal 16dmg
    {
        'base' : {'elephantHeal' : 'elephantHeal'}
    },
    //elephantto them
    {
        'shield' : {},
        'base' : {'elephantAttack' : 'elephantAttack'}
    }
);

var nighttime = new Card('nighttime' , 3,
    //you nighttime, consume all sunlight in the game, if sunlight consumed >=10 sunlight draft TWICE every turn, else gain x sunlight luck
    {
        'shield' : {'nighttimeHalf' : 'nighttimeHalf'},
        'base' : {'nighttime' : 'nighttime'}
    },
    //they nighttime
    {
        'shield' : {},
        'base' : {'sunlight' : -9999}
    }
);

/************************************************************************
     Neutral Cards
    Provide interesting or simple utility, cards don't fit in or are self-sufficient
***********************************************************************/

var medicalkit = new Card('medicalkit', 1, 
    // medical kit : heals 4 hp, gives 1 reroll
    //youmedical
    {
        'base' : {'hp' : 6, 'reroll' : 1}
    },
    //theymedical
    {
        'base' : {}
    }
);

var amputate = new Card('amputate', 1, 
    // amputate lowers strength by 2, removes all negative status effects
    //youamputate
    {
        'base' : {'clearNegativeEffects' : 'clearNegativeEffects', 'strength' : -2, 'selfDamage' : 'selfDamage'}
    },
    //theyamputate
    {
        'base' : {}
    }
);

var gamblersconceit = new Card('gamblersconceit', 1,
    // gamblersconceit, add 1 reroll, 1 luck :D
    //yougamble
    {
        'base' : {'reroll' : 2}
    },
    //theygamble
    {
        'base' : {}
    }
);

var slash = new Card('slash', 1,
    // slash, deal 6 dmg
    //youslash
    {
        'base' : {}
    },
    //theyslash
    {
        'shield' : {},
        'base' : {'hp' : -6}
    }
);

var shield = new Card('shield', 1,
    // block all negative effects from cards
    //ShieldToYou
    {
        'base' : {}
    },
    //ShieldToThem
    {
        'base' : {}
    }
);

var scavenge = new Card('scavenge', 1,
    // scavenge, draw 2 cards next turn
    //you scavenge
    {
        'base' : {'scavenge' : 'scavenge'}
    },
    //they scavenge
    {
        'base' : {}
    }
);

var calladoctor = new Card('calladoctor', 2, 
    // calladoctor : heal 6hp, remove negative status, 1 reroll
    //youcall
    {
        'base' : {'clearNegativeEffects' : 'clearNegativeEffects', 'hp' : 4, 'reroll' : 1}
    },
    //theycall
    {
        'base' : {}
    }
);

var lumberjack  = new Card('lumberjack', 2,
    // deal 8 dmg, stop sunlight generation this turn
    //lumbertoYou
    {
        'base' : {}
    },
    //lumbertoThem
    {
        'shield' : {},
        'base' : {'hp' : -8}
    } 
);

var cancel = new Card('cancel', 2, 
    // cancel : cancelsOpponentCard
    //youmedical
    {
        'base': {}
    },
    //theymedical
    {
        'base' : {}
    }
);

var threeleafclover = new Card('threeleafclover', 2, 
    // threeleafclover : add 3 rerolls, 2 luck, and 1hp
    // youthree
    {
        'base': {'reroll' : 3, 'luck' : 2, 'hp' : 1}
    },
    // theyfour
    {
        'base' : {}
    }
);

var throwcard = new Card('throwcard', 2, 
    // throw card : discard your leftmost card (excluding this one) to deal 12dmg
    //you throw
    {
        'base' : {'throwCard' : 'throwCard'}
    },
    //they throw
    {
        'shield' : {},
        'base' : {'hp' : -12}
    }
);

var workoutroutine = new Card('workoutroutine', 3, 
    // workoutroutine : add 6 regen, add 2 strength
    // youworkout
    {
        'base': {'regen' : 6, 'strength' : 2}
    },
    // theyworkout
    {
        'base' : {}
    }
);

var armsrace = new Card('armsrace', 3,
    // arms race : destroy both hands, both players gain extra draft permenently
    //youarms
    {
        'base' : {'armsrace' : 'armsrace'}
    },
    //theyarms
    {
        'shield' : {}, //yes if they shield you just put yourself into an armsrace
        'base' : {'armsrace' : 'armsrace'}
    }
);

var mergerealities = new Card('mergerealities', 3,
    // mergerealities : combine both players statuses for both players
    // you merge
    {
        'base' : {'mergerealities' : 'mergerealities'}
    },
    // they merge
    {
        'base' : {'mergerealities' : 'mergerealities'}
    }
)


/************************************************************************
     Poison Cards
    Building up poison for increasing passive damage and then using that poison to create stronger attacks

    DUE TO TECHNICAL ISSUE POISON CARDS HAVE TO DO ONE MORE POISON THAN ADVERTISED IN RESOLVE INTERACTIONS
***********************************************************************/

var poisonbottle = new Card('poisonbottle', 1,
    // apply4poisoned
    //BottleToYou
    {
        'base' : {}
    },
    //BottleToThem
    {
        'shield' : {},
        'base' : {'poison' : 4}
    }
);

var chemist = new Card('chemist', 1,
    // apply 3 poison, if they were poisoned deal 4dmg
    //ChemistToYou
    {
        'base' : {}
    },
    //ChemistToThem
    {
        'shield' : {},
        'base' : {'chemist': 'chemist'} // apply 2 poison, if they were poisoned deal 4dmg
    }
);

var venomsting = new Card('venomsting', 1,
    // apply 2 poison, if they are poisoned apply another 3 poison
    //youplaysting
    {
        'base' : {}
    },
    //theyplaysting
    {
        'shield' :{},
        'base' : {'venomsting' : 'venomsting'}
    }
);

var neurotoxins = new Card('neurotoxins', 2, 
    // apply 3 poison, then deal dmg equal to their poison
    //youneuro
    {
        'base' : {}
    },
    // theyneuro
    {
        'shield' : {},
        'base' : {'neurotoxins' : 'neurotoxins'}
    }
);

var leech = new Card('leech', 2, 
    // apply 3 poison, then heal dmg equal to their poison
    //youneuro
    {
        'base' : {'leech' : 'leech'}
    },
    // theyneuro
    {
        'shield' : {},
        'base' : {'poison' : 3}
    }
);

var epidemic = new Card('epidemic', 3,
    // apply 2 poison, then double poison on opponent
    //youepedemic
    {
        'base' : {}
    },
    // theyepedemic
    {
        'shield' : {},
        'base' : {'epidemic' : 'epidemic'}
    }
);

var streetfood = new Card('streetfood', 3,
    // apply 8 poison
    //youstreet
    {
        'base' : {}
    },
    // theystreet
    {
        'shield' : {},
        'base' : {'poison' : 8}
    }
);

/************************************************************************
    Technical Cards
    combines unique parts of archetypes :O
***********************************************************************/

var toxicbloom = new Card('toxicbloom', 2,
    // apply 3 poison, gain 3 sunlight
    //youtoxic
    {
        'base' : {'sunlight' : 3}
    },
    // theytoxic
    {
        'shield' : {},
        'base' : {'poison': 3}
    }
);

var witheredpetals = new Card('witheredpetals', 3,
    // apply 3 poison, gain 3 sunlight
    //youtoxic
    {
        'shield' : {'witheredpetalsBlocked' : 'witheredpetalsBlocked'},
        'base' : {'witheredpetals' : 'witheredpetals'}
    },
    // theytoxic
    {
        'shield' : {'poison': -100000},
        'base' : {'poison': -100000, 'sunlight' : -100000}
    }
);
