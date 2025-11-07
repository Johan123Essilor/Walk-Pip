import { Row, Col } from 'reactstrap';

const SafetyAccordian = () => {

    const ruleSet = [
        {
            id: 1,
            tagId: "One", 
            rule: "Regla #1",
            title: "Conoce tus límites",
            description: "Lo sé, lo sé... probablemente no es lo que la mayoría de los aventureros o amantes de la adrenalina quieren escuchar justo antes de prepararse para una caminata... ¡pero esta es importante! Ser consciente de tu nivel de experiencia, tus capacidades físicas y tus necesidades sociales importa más que cualquier otra cosa cuando recorres terrenos desconocidos o potencialmente peligrosos. ¡Lo último que tú o alguien más quisiera es tener que llamar a un equipo de búsqueda y rescate!"
        },
        {
            id: 2,
            tagId: "Two",
            rule: "Regla #2",
            title: "Planifica tu caminata",
            description: "Planifica tu viaje usando... ¡este sitio web! Asegúrate de saber qué sendero quieres visitar, dónde se encuentra exactamente, su nivel de dificultad y seguridad, así como cualquier equipo que necesites para tener una caminata exitosa y segura. Dos cosas que deberías considerar antes de salir:",
            subList: [
                {
                    subTitle: "Deja un plan de viaje",
                    subDescription: "Este es un plan de tu recorrido (dónde estarás caminando, información de contacto, fechas y horarios de salida/regreso, etc.) que puedes dejar en casa o con alguien más, para que otros sepan dónde estarás y cuándo esperas regresar."
                },
                {
                    subTitle: "Ten un plan de respaldo",
                    subDescription: "Esta probablemente se explica sola. Las cosas no siempre salen bien o como se espera, así que en caso de emergencia, ¡ten un plan preparado! Los entrenamientos en RCP y primeros auxilios son un excelente comienzo para estar siempre preparado."
                }
            ],
            subText: "También es importante estar preparado para cualquier posible cambio en las condiciones del clima dentro de lo razonable para la zona o cualquier alerta del parque. Recuerda tener siempre un medio de comunicación (¡los teléfonos celulares NO son confiables!) como un localizador personal."
        },
        {
            id: 3,
            tagId: "Three",
            rule: "Regla #3",
            title: "Qué llevar contigo",
            description: "El Servicio de Parques Nacionales sugiere que lleves contigo los 10 elementos esenciales que deberías tener en toda caminata. Algunos de ellos incluyen:",
            listItems: [
                "Comida y agua",
                "Calzado adecuado",
                "Repelente de insectos",
                "Filtro/Purificador de agua",
                "Mochila",
                "Tienda de campaña",
                "Saco de dormir",
                "Botiquín de primeros auxilios",
                "Protector solar",
                "Linterna"
            ],
            subText: "Cualquier otra cosa que creas que podrías necesitar... ¡llévala!"
        },
        {
            id: 4,
            tagId: "Four",
            rule: "Regla #4",
            title: "Camina con seguridad",
            description: "Esta parece obvia, ¿verdad?... es básicamente de lo que hemos estado hablando todo el tiempo. Tomémonos un momento para ver el panorama general. Las cosas esenciales que te mantendrán seguro en una caminata diaria incluyen comer y beber suficiente agua, tomarte tu tiempo y mirar por dónde caminas, usar repelente contra mosquitos y otros insectos molestos, y por supuesto ¡PEDIR AYUDA! a un guardabosques o a otro excursionista si la necesitas. ¡Mantente seguro allá afuera!"
        }
    ];

    return (
        <div className="accordion my-5" id="accordionExample">
            {ruleSet.map(({id, tagId, rule, title, description, subList, listItems, subText}) => {
                const isExpanded = id === 1;
                const collapseId = `collapse${tagId}`;

                return (
                    <div key={id} className="accordion-item">
                        <h2 
                            className="accordion-header" 
                            id={`heading${tagId}`}
                        >
                        <button 
                            className={`accordion-button${isExpanded ? "" : " collapsed"}`}
                            type="button" 
                            data-bs-toggle="collapse" 
                            data-bs-target={`#${collapseId}`} 
                            aria-expanded={isExpanded ? "true" : "false"}
                            aria-controls={collapseId}
                        >
                            {rule}: {title}
                        </button>
                        </h2>
                        <div
                            id={collapseId}
                            className={`accordion-collapse collapse${isExpanded ? " show" : ""}`}
                            aria-labelledby={`heading${tagId}`}
                            data-bs-parent="#accordionExample"
                        >
                            <div className="accordion-body">
                                {description}
                                {subList ? (
                                    <div className='mt-3'>
                                        {subList.map(({subTitle, subDescription}) => {
                                            return (
                                                <div key={subTitle}>
                                                    <h5 className='fw-bold text-success'>{subTitle}</h5>
                                                    <p>{subDescription}</p>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ) :
                                listItems ? (
                                    <div className='mt-3'>
                                        <Row className='text-center fw-bold'>
                                            <Col sm={6}>
                                                <ul>
                                                    {listItems.map((item, index) => {
                                                        if (index < 5) {
                                                            return (
                                                                <li className='list-unstyled' key={index}>{item}</li>
                                                            )
                                                        }
                                                        return null;
                                                    })}
                                                </ul>
                                            </Col>
                                            <Col sm={6}>
                                                <ul>
                                                    {listItems.map((item, index) => {
                                                        if (index >= 5) {
                                                            return (
                                                                <li className='list-unstyled' key={index}>{item}</li>
                                                            )
                                                        }
                                                        return null;
                                                    })}
                                                </ul>
                                            </Col>
                                        </Row>
                                    </div>
                                ) :
                                null
                                }
                                {subText ? (
                                    <div className='mt-3'>
                                        <p>{subText}</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SafetyAccordian;
