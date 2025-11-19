vale hay mucho de que hablar, lo primero es que despues del backend, voy a hacer el frontend de admin y el frontend de cliente, entonces con base en estos casos, vas a pensar la logica del backend:
-necesito como administrador, poder: crear,editar,eliminar los tours disponibles, estos Tours tienen su complejidad: 

-los tours tienen: informacion, muchos detalles, en ingles y español, prrecios (1pax, 2pax. 3pax y 4-8pax, es decir tienen 4 precios diferentes, en cop y en usd) , itinerarios diarios con actividades dinamicas por dia, en oingles y español, tambien tiene fotos y otras cosas que luego acabamos de confirmar. Todos estos detalles deben poder ser modificables 

-Las REservas: las reservas se crean con nombre, eemail,, numero de telefono(internacionales), documento, cantidad de personas,precio del tour en base a si es 1 pax, 2pax, 3pax y de 4a 8 pax, fecha de la departure y  tour, al procesar la creación de la reserva, el sistema deberia crear una departure (la explico en el siguiente punto). esta departure tendra una fecha y un precio que es el el precio original del tour, pero sera una copia del precio del tour, porque sera dinamico ya que podremos hacer descuentos a las reservas, como las reservas estan conectadas directamente con los departures, y hay 2 clases de departures, publico y privado, pero los descuentos se hacen en las reservas entonces cada reseva deberia poder permiir entre los demas datos, tambien poder cambiarle el precio y que esto a su vez, el sistema se lo cambie al departure.; En la reserva no se puede editar la fecha (Esto se hace usando el departure al que la reserva esta ligada), pero si se puede ver la fecha que es la fecha del departure, que se actualiza si actualizamos en el departure; si  tengo un departure con reservas de 2 personas cada reserva, yo puedo entrar a 1 de esas reservas y cambiarle el precio solo  a 1 reserva  y esto en el sistema tambien cambiaria o le rebajaria al deeparture ese descuento de esa reserva. **tu debes analizar todo esto que te estoy diciendo, y pensar en como el sistema reconoce todos esos efectos en cascada en base a toda esta logica que te estoy dando y piensa en todos los posibles casos que no estoy teniendo en cuenta 

-Los departures son salidas de aglun tour con reservas en una fecha específca, los departures puedes ser privados o publicos, los departures tienen un limite de 8 personas, los departures publicos deberian ser joinables hasta completar el maximo de 8 peronas, es decir, los departures publicos deerian tener varios endpoints, uno publico para ver los departures publicos y sus fechas y todo, y uno publico para unirme al departure con una reserva, y todos los otros endpoints admin para modificar todo lo que te explicare a continuación...(toda reserva que se haga por medio de los enpoints publicos y administrativos de crear reserva, crearian un departure privado);   Pero yo como administrador tambien quiero crear departures publicas para poder mostrar al usuario fechas y que se unan, es decir una departure con 0 personas de inicial y publica;  vale voy a explicarte lo complejo de los departures: ***supongo que el precio de estas departures se obtinen de los precios del tour igual como son 4 precios pues tu pensaras como hacer esa logica en base a las reservas, porque yo puedo escoger la cantidad de personas a reservas, entonces ese departure debe attachear a esa reserva un precio especifico que es la copia del predeterminado en el tour, pero que ccomo te dije se puede modificar si le cambio el precio a la reserva, osea le hago un descuento,l pero a pesar de que le aplique descuento a una reseva, si quedan espacios aun en el departure publico, sigue mostrando el precio normal para las proximas reservas que se quieran unir ; desde los departures es que se pueden editar las salidas de las reservas, si es publica: eso significa que esta departure tiene varias reservas ligadas a ella, entonces para editar esta fecha, se puede hacer pero eso afectaria a todas las reservas en la departure. Tambien hay que pensar en la funcionalidad que ocurre cuando queremos pasar una reservaq ue esta ligada a un departure publico a privada, es decir se actualizaria el departure publico, quitando esas personas y creearia un departure privado para ponerlas ahi.  si esa es la unica reserva en el departure, ; si es una departure privada, pues quiero poder hacerla publica y que tome toda la funcionalidad de la publica y pueda unir mas reservas a ella, etc. 



hay cosas que ya estan preparadas:

### Technology Stack
- **Backend**: Firebase Cloud Functions (Node.js 22)
- **Database**: Firestore (NoSQL)
- **SDK**: Firebase Admin SDK
- **Runtime**: Google Cloud Run (2nd Gen)
- **Auth**: Header-based secret key


**---Migration IMportant Notes---**
Estoy trabajando con un proyecto backend de 
      Firebase Cloud Functions llamado 
      "nevadotrektest01" que es un sistema completo 
      de gestión de tours y reservas para una empresa
      de turismo de aventura en Colombia.
    3 
    Configuración disponible:
   22 - Los archivos firebase.json y .firebaserc 
      contienen la configuración del proyecto
   23 - ADMIN_SECRET_KEY está configurado y ENABLED 
      en Google Cloud Secret Manager
       - El secreto está disponible para las funciones
      en producción
   25 - El sistema usa el nuevo sistema de parámetros
      de Firebase Functions
   26 

Ahora te explicare como visualizo el frontend Administrativo: necesitio funcionalidad para todo, quiero un login muy sencillo como ya tenemos la ADMIN_SECRET_KEY configurada en firebase, entonces esta key es la que nos va a servir para validar todos los endpoints administrativos... el login,, quiero que sea sencillo, que yo ingrese con la key y ya, que el login solo sea usando el endpoint de obtener las reservas y  si resulta ok pues le deje pasar, que almacene en la sesion la key y con esa hagamos todas las operaciones siguientes:

-lo primero que quiero al entrar despues del login con la key es al calendario, ahi quiero una vista de un calendario grande como el de google calendar y en cada celda del dia, al hacer hover vemos las departures ese dia, al dar click en alguna departure nos abre el modal del departure, si es publico , muestra una lista de todas las reservass en el con informacion y si damos click vamos al modal de  la reserva que ese te lo explico luego... ; si la departure el privada miestra solo la lista de una reserva con su info y tambien al dar click se cambia al modal de la reserva; El modal de departures además de mostrar las reservas en el, permite cambiarlo de fecha y cambiarlo de tour, eso significa que se elimina el departure y se crea uno nuevo, obviamente si es publico pues se lleva todas las reservas ligadas al nuevo tour o fecha; tambien se permite eliminar el departure, pero solamente si se ha solucionado el estado de todas sus reservas, si se han movido o se han cancelado, de otro modo el backend deberia tambien mandar una advertencia de que solucione las reservas, por eso al dar click a cualquier reseerva ahi en el modal de departure, accedemos al modal de la reserva, para tener cerca esas funcionalidades;    este calendario lo quiero en la primera pagina deel admin, va a haber un left  sidepanel con todas las paginas, siendo calendario la primera. las funcionalidades del modal del departure estan bien repartidas en tabs: tab1:reservas , tab2: fecha , Tab3: tour. ; en esta seccion de departures tambien quiero poder crear departures publicas para que aparezcan y se puedan unir, osea una departure sin personas, pero que salga como publica



-la siguiente pagina en el sidepanel es reservas: aqui quiero una lista con tarjetas de reservas, con algo de info en la tarjeta y al hacerr click en la reserva se abre un modal con toda la funcionalidad de la reserva, el mismo modal que se abre al dar click en alguna reserva dentro del modal de departure, este modal de reserva tiene diferentes tabs para separar la funcionalidad: -tab 1: datos de cliente, todos los datos de la reserva,los que te hable arriba, y el boton para editar todos esos datos como yo quiera proque soy el admin; -Tab 2: precio, esta funcionalidad de cambiar precio es la que esta conectada con el departure, yo puedo hacer descuentos a mis clientes, entonces quiero acceder a esta tab, ver el precio que tiene y cambiarlo y ya , esto muestra diferentes ayudas de ux dependiendo si es de 1pax, 2 pax, 3pac, o 4-8 pax, y entonces esto restaria el precio al departure.; -Tab3: departure, aqui en esta tab de departure se vera un resumen del departure ademas de la opcion de cambiar la reserva de tipo publico a privado y visceversa (si es una reserva privada, pues es solo es cambiar el departure de publicco a privado o al reves, pero si es una reserva que esta ligada a un departure publico con mas reservas entonces si deberia crear una nueva departure en caso de quererla pasar a privada, un departure solo para esa reserva, y que las otras pues se queden en el departure publico), si es privado o si es publico , y al dar clicck nos cambia al modal de la departure que esta en el punto anterior alla estan las opciones de cambio de fecha y tour, pero eso ya le pertenece a la funcionalidad del modal de departure; tab 4: estado, aqui puedo cambiar el estado de la reserva, para cancelarla o pasarla a confirmada o pendiente o pagada, con estos estados tambien hay que tener cuidado porque se conectan a otras funcnonalidades y a otras partes de la db, piensa y diime que nos falta pensar aqui; en esta seccion de reservas, tambien quiero poder yo como administrador crear resevaas, obvio que me pida la fecha y todos los datos y el tour, para poder que el sistema cree la reserva y la departure, tambien quiero la opcion de elegir co¿n un check si crear la departure privada o publica.

-La siguiente pagina es la de Tours, aqui podre ver una lista con tarjetas de todos los tours y su estado, si estan activos o no , y al dar click en la tarjeta abrimos la modal de tour, ahi tambien tendremos tabs cubriendo toda la funcionalidad de tours:
		Tab1: aqui estara la informacion de los tours:
		tpdas estas entidades del tour son en español e ingles, en el caso del precio es cop y usd
			### 1. TOUR Entity (The Master Template)

#### Purpose
Versioned catalog of tour products

#### Key Attributes
```typescript
interface Tour {
  // Identification & Versioning
  tourId: string;                    // Unique identifier
  version: number;                   // Version number (1, 2, 3...)
  versionGroupId: string;            // Groups all versions of same tour
  previousVersionId?: string;        // Link to previous version
  changeReason?: string;             // Why this version was created

  // Bilingual Content
  name: BilingualContent;
  description: BilingualContent;
  shortDescription: BilingualContent;

  // Visual Assets
  images: string[];
  coverImage: string;

  // Tour Details (Array of label-value pairs)
  tourDetails: TourDetail[];

  // Dynamic Itinerary
  type: 'multi-day' | 'single-day';
  totalDays: number;
  days: Day[];

  // Inclusions & Exclusions
  inclusions: TourItem[];
  exclusions: TourItem[];

  // Recommendations
  recommendations: TourItem[];

  // FAQs
  faqs: FAQ[];

  // Pricing Tiers
  pricingTiers: PricingTier[];

  // Capacity Defaults
  defaultCapacity: CapacityDefaults;

  // Difficulty & Requirements
  difficulty: Difficulty;
  physicalRequirements: BilingualContent;


  // Location & Logistics
  location: Location;

  // Altitude Information
  altitudeInfo?: AltitudeInfo;

  // Status & Metadata
  status: 'ACTIVE' | 'INACTIVE';
  category: string;
  tags: string[];


 
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
```

en esta tab tendremos toda la info del tour , pero solo la info y la podremos actualizar 


		tab2: en esta segunda tab del modal de tour tendremos precios, aqui muestra toda  la info de los precios del tour por 1, 2 ,3 o 4-8 pax y las opciones para editarlos todos
		
		tab3: e esta tab tendremos el itinerario del tour, toda esta pantalla de la tab sera para editar el itinerario, puedo añadir dinamicamente dias y actividades tambien dinamicas durante el dia, sera un parrafo cada actividad
		
		tab4: fotos , aqui tendremos todas las imagenes y podremos agregar mas o quitar 
		
		
		
		
		
		
		

		
		
		
**/TODAS ESTAS FUNCIONALIDADES QUE TE MENCIONÉ TIENEN UN EFECTO, YA SEA LOCAL O UN EFECTO EN TODA LA BASE DE DATOS, POR FAVOR ANALIZA MUY BIEN ESTOS EFECTOS EN CASCADA DE TODO. ANALIZA COMO SI FUERAS EXPERTO EN PROYECT LEADING Y MEJORA TODO LO QUE YO NO PUEDA, PERO LA IDEA PRINCIPAL ES MANTENERLO TODO LO MAS SIMPLE QUE PODAMOS, UNA ARQUITECTURA CLARA Y COMPLETAMENTE ESCALABLE		