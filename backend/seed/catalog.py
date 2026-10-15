"""
Demo catalog: the Funko Pop! figures photographed for the store.
Photos live in seed/images/<sku>-<n>.webp (1 = primary).
"""
from decimal import Decimal

# (sku, name, franchise, price, stock, options)
# options: new, featured, sale (weekly offer %), edition (variant text)
PRODUCTS = [
    # Demon Slayer
    ("FNK-DS-870", "Inosuke Hashibira #870", "Demon Slayer", 89900, 9, {"featured": True}),
    ("FNK-DS-876", "Giyu Tomioka #876", "Demon Slayer", 109900, 11, {"edition": "Edición especial"}),
    ("FNK-DS-868", "Nezuko Kamado #868", "Demon Slayer", 89900, 11, {"sale": 20}),
    ("FNK-DS-1749", "Nezuko Kamado #1749", "Demon Slayer", 94900, 7, {"new": True}),
    ("FNK-DS-1533", "Tengen Uzui #1533", "Demon Slayer", 94900, 6, {}),
    ("FNK-DS-1856", "Kyojuro Rengoku #1856", "Demon Slayer", 99900, 12, {"new": True, "featured": True}),
    ("FNK-DS-1841", "Daki #1841", "Demon Slayer", 94900, 6, {"new": True}),
    # Naruto Shippuden
    ("FNK-NAR-1436", "Sasuke Uchiha #1436", "Naruto Shippuden", 89900, 10, {"featured": True}),
    ("FNK-NAR-1318", "Naruto Uzumaki con Rasenshuriken #1318", "Naruto Shippuden", 129900, 10, {"edition": "Brilla en la oscuridad · Exclusivo Funko.com", "featured": True}),
    ("FNK-NAR-1022", "Itachi con cuervos #1022", "Naruto Shippuden", 109900, 11, {"edition": "Edición especial"}),
    ("FNK-NAR-1027", "Itachi Anbu #1027", "Naruto Shippuden", 119900, 10, {"edition": "Exclusivo Chase Collectibles"}),
    ("FNK-NAR-73", "Jiraiya sobre el sapo #73", "Naruto Shippuden", 229900, 2, {"edition": "Pop! Rides · Edición especial"}),
    ("FNK-NAR-934", "Pain #934", "Naruto Shippuden", 84900, 8, {"sale": 15}),
    # One Piece
    ("FNK-OP-1607", "Luffy Quinta Marcha #1607", "One Piece", 99900, 12, {"featured": True, "new": True}),
    ("FNK-OP-923", "Roronoa Zoro #923", "One Piece", 119900, 12, {"edition": "Brilla en la oscuridad · Exclusivo Volcano X"}),
    ("FNK-OP-100", "Portgas D. Ace #100", "One Piece", 89900, 7, {"sale": 25}),
    ("FNK-OP-KAIDO", "Kaido", "One Piece", 189900, 2, {"edition": "Tamaño gigante 15 cm"}),
    ("FNK-OP-127", "Barbablanca con el Moby Dick #127", "One Piece", 289900, 1, {"edition": "Pop! Rides · Exclusivo Funko.com"}),
    # Pokémon
    ("FNK-PKM-920", "Arcanine #920", "Pokémon", 129900, 6, {"edition": "Tamaño gigante 15 cm", "featured": True}),
    ("FNK-PKM-856", "Lucario #856", "Pokémon", 84900, 9, {}),
    ("FNK-PKM-843", "Charizard #843", "Pokémon", 99900, 12, {"sale": 20}),
    ("FNK-PKM-781", "Psyduck #781", "Pokémon", 79900, 12, {}),
    ("FNK-PKM-886", "Oshawott #886", "Pokémon", 79900, 10, {"new": True}),
    ("FNK-PKM-626", "Eevee #626", "Pokémon", 79900, 14, {}),
    ("FNK-PKM-598", "Pikachu #598", "Pokémon", 79900, 15, {"sale": 15}),
    ("FNK-PKM-849", "Pidgeotto #849", "Pokémon", 79900, 8, {}),
    # Marvel
    ("FNK-MRV-1456", "Spider-Man Superior #1456", "Marvel", 109900, 6, {"edition": "Cabeza bamboleante · Exclusivo Amazon", "new": True}),
    ("FNK-MRV-1362", "Deadpool #1362", "Marvel", 99900, 8, {"edition": "Cabeza bamboleante · Brilla en la oscuridad"}),
    ("FNK-MRV-1159", "El Sorprendente Spider-Man #1159", "Marvel", 89900, 7, {}),
    ("FNK-MRV-1158", "Spider-Man, tu amigable vecino #1158", "Marvel", 89900, 6, {"sale": 20}),
    ("FNK-MRV-772", "Miles Morales con traje de tecnología avanzada #772", "Marvel", 84900, 9, {}),
    ("FNK-MRV-1239", "Peter B. Parker y Mayday #1239", "Marvel", 119900, 10, {"edition": "Exclusivo Hot Topic"}),
    ("FNK-MRV-1231", "Spider-Punk #1231", "Marvel", 119900, 11, {"edition": "Exclusivo Funko.com", "featured": True}),
    ("FNK-MRV-1444", "Spider-Man con traje simbionte #1444", "Marvel", 89900, 7, {"new": True}),
    ("FNK-MRV-1449", "Spider-Man #1449", "Marvel", 89900, 8, {"new": True}),
    ("FNK-MRV-573", "Capitán América #573", "Marvel", 84900, 6, {"sale": 30}),
    ("FNK-MRV-604", "Viuda Negra #604", "Marvel", 84900, 12, {}),
    ("FNK-MRV-580", "Iron Man «Yo soy Iron Man» #580", "Marvel", 139900, 2, {"edition": "Brilla en la oscuridad · Exclusivo PX Previews"}),
    ("FNK-MRV-1373", "Arma X #1373", "Marvel", 94900, 6, {"edition": "50 años de Wolverine"}),
    # DC
    ("FNK-DC-518", "Batman #518", "DC", 89900, 7, {"edition": "85 aniversario de Batman"}),
    ("FNK-DC-BBYND", "Batman Beyond", "DC", 99900, 11, {}),
    # Star Wars
    ("FNK-SW-426", "Darth Vader #426", "Star Wars", 99900, 12, {"edition": "Serie Concepto"}),
    ("FNK-SW-402", "El Mandaloriano con El Niño #402", "Star Wars", 94900, 6, {"sale": 15}),
    # Other anime
    ("FNK-DB-1211", "Goku Ultra Instinto con Kamehameha #1211", "Dragon Ball", 159900, 2, {"edition": "Edición limitada Convención de Otoño 2022", "featured": True}),
    ("FNK-MHA-1348", "Shoto Todoroki #1348", "My Hero Academia", 119900, 11, {"edition": "Brilla en la oscuridad · Exclusivo Volcano X"}),
    ("FNK-MHA-1008", "Deku Infinito con Eri #1008", "My Hero Academia", 109900, 11, {}),
    ("FNK-CSM-1677", "Chainsaw Man #1677", "Chainsaw Man", 94900, 8, {"new": True}),
    ("FNK-JJK-1120", "Satoru Gojo #1120", "Jujutsu Kaisen", 109900, 12, {"edition": "Edición especial", "featured": True}),
    ("FNK-AOT-1321", "Eren Jaeger #1321", "Attack on Titan", 89900, 6, {}),
    ("FNK-HQ-1390", "Kei Tsukishima #1390", "Haikyu!!", 89900, 12, {"sale": 20}),
    ("FNK-CB-1215", "Ed y Ein #1215", "Cowboy Bebop", 99900, 10, {}),
    ("FNK-BC-1420", "Asta en forma demonio #1420", "Black Clover", 89900, 6, {}),
    ("FNK-BC-1423", "Yami Sukehiro #1423", "Black Clover", 89900, 12, {}),
    # Series, movies and games
    ("FNK-ARC-1489", "Mel #1489", "Arcane", 94900, 6, {"new": True}),
    ("FNK-ARC-1487", "Viktor Campeón #1487", "Arcane", 94900, 6, {"new": True}),
    ("FNK-AVT-534", "Aang con Momo #534", "Avatar: La leyenda de Aang", 94900, 12, {}),
    ("FNK-SNC-978", "Tails #978", "Sonic the Hedgehog", 109900, 11, {"edition": "Serie Specialty"}),
    ("FNK-RM-333", "Rick Pepinillo #333", "Rick and Morty", 79900, 9, {"sale": 25}),
    ("FNK-GF-1607", "Ghostface #1607", "Scream", 119900, 11, {"edition": "Brilla en la oscuridad · Exclusivo Amazon"}),
    ("FNK-HTD-1872", "Chimuelo #1872", "Cómo entrenar a tu dragón", 109900, 12, {"edition": "Exclusivo Amazon", "new": True}),
    ("FNK-JW-586", "Blue, la velociraptor #586", "Jurassic World", 84900, 6, {}),
    ("FNK-GOT-VIS", "Viserion de hielo", "Game of Thrones", 159900, 2, {"edition": "Exclusivo BoxLunch"}),
    ("FNK-LOTR-GWA", "Gandalf sobre Gwaihir", "El Señor de los Anillos", 259900, 2, {"edition": "Pop! Rides"}),
    ("FNK-LOTR-BAL", "Balrog", "El Señor de los Anillos", 219900, 2, {"edition": "Pop! Deluxe (escena)"}),
    ("FNK-LOTR-GAN", "Gandalf el Gris", "El Señor de los Anillos", 89900, 6, {}),
    # Disney and pop culture
    ("FNK-DIS-125", "Stitch, experimento 626 #125", "Disney", 84900, 10, {}),
    ("FNK-DIS-1112", "Minnie Mouse #1112", "Disney", 89900, 6, {"edition": "Archivos de Walt Disney"}),
    ("FNK-SAN-88", "Kuromi #88", "Sanrio", 129900, 2, {"edition": "Aterciopelado · Edición limitada Chase"}),
    ("FNK-SS-138", "Frutillita #138", "Strawberry Shortcake", 84900, 12, {"edition": "45 aniversario"}),
    ("FNK-QUE-375", "Freddie Mercury «Nací para amarte» #375", "Queen", 99900, 11, {}),
    ("FNK-QUE-97", "Freddie Mercury #97", "Queen", 139900, 2, {"edition": "Colección Diamante · Edición especial"}),
    ("FNK-MJ-345", "Michael Jackson #345", "Michael Jackson", 99900, 11, {}),
    ("FNK-MJ-360", "Michael Jackson #360", "Michael Jackson", 99900, 11, {"sale": 15}),
    ("FNK-SHK-66", "Shakira Fijación Oral (álbum en español) #66", "Shakira", 109900, 6, {"featured": True}),
    ("FNK-SHK-40", "Shakira Oral Fixation (álbum en inglés) #40", "Shakira", 109900, 12, {}),
]

USD_RATE = Decimal("4150")


def product_fields(sku, name, franchise, price, stock, opts):
    """Model fields for one catalog row; prices in whole pesos."""
    edition = opts.get("edition")
    base = Decimal(price)
    fields = {
        "sku": sku,
        "name": f"Funko Pop! {name}",
        "base_price": base,
        "stock": stock,
        "is_new": opts.get("new", False),
        "is_featured": opts.get("featured", False),
        # Landed cost around 45% of the shelf price.
        "cost_usd": (base * Decimal("0.45") / USD_RATE).quantize(Decimal("0.01")),
        "profit_margin_pct": Decimal("40.00"),
        "tags": ["funko", "pop", franchise.lower(), *name.lower().replace("#", "").split()[:3]],
        "short_description": (
            f"Funko Pop! de {name.split(' #')[0]} ({franchise})."
            + (f" Edición: {edition}." if edition else "")
        ),
        "description": (
            f"Figura de vinil Funko Pop! de {name.split(' #')[0]}, de la colección {franchise}. "
            "Viene en su caja original con ventana, ideal para exhibir o coleccionar.\n\n"
            + (f"Edición: {edition}.\n\n" if edition else "")
            + "Producto original con licencia oficial. Unidad revisada y fotografiada por nuestro equipo."
        ),
    }
    sale = opts.get("sale")
    if sale:
        # The shelf price is the "before" price; the weekly offer price is the base.
        fields["compare_price"] = base
        # Round to the thousand and end in 900, like shelf prices.
        fields["base_price"] = (base * (100 - sale) / 100000).quantize(Decimal("1")) * 1000 - 100
        fields["is_on_sale"] = True
        fields["sale_percentage"] = sale
    return fields
