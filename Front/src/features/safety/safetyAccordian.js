import { Row, Col } from 'reactstrap';
const SafetyAccordian = () => {

    const ruleSet = [
        {
            id: 1,
            tagId: "One", 
            rule: "Rule #1",
            title: "Know Your Limits",
            description: "I know, I know, probably not what most adventurers and thrill-seekers want to hear right off the bat when preparing for a hike... but this one is important! Being aware of your experience level, your physical capabilites, and social necessities matter more than anything else when traversing unknown or potentially dangerous terrain. The last thing you or anyone else would want, is to call for a search and rescue team!"
        },
        {
            id: 2,
            tagId: "Two",
            rule: "Rule #2",
            title: "Plan Your Hike",
            description: "Plan your trip using...what do you know! This website! Make sure you are aware of what trail you want to visit, where exactly it is, its difficulty and safety ratings, as well as any equipment that you will need to be successful and safe on this hike. Two things you should consider before leaving:",
            subList: [
                {
                    subTitle: "Leave a Trip Plan",
                    subDescription: "This is a plan of your trip (where you are hiking, contact info, dates and times for leaving/returning, etc.) that you can leave at home or with someone else so that others are aware of where you will be and when you are expected to be gone."
                },
                {
                    subTitle: "Have a Backup Plan",
                    subDescription: "This one is probably a bit self-explanatory. Things don't always go right or as they are expected to, so in case of an emergency, have a plan ready! CPR and First Aid trainings are a great start for always being prepared."
                }
            ],
            subText: "It is also important to be ready for any possible changes in weather conditions that are within reason for the area or any park alerts. Note to always have a means of communication (cell-phones are NOT reliable!) like a personal locator beacon."
        },
        {
            id: 3,
            tagId: "Three",
            rule: "Rule #3",
            title: "What to Bring",
            description: "The National Park Service suggest you bring your 10 essential things that you should NEED to be bringing with you on your hike. Some of which likely include:",
            listItems: [
                "Food and Water",
                "Proper Footware",
                "Bug Spray",
                "Water Filter/Purifier",
                "Backpack",
                "Tent",
                "Sleeping Bag",
                "First Aid Kit",
                "Sunscreen",
                "Flashlight"
            ],
            subText: "Anything else you are thinking about bringing because you might need it... bring it!"
        },
        {
            id: 4,
            tagId: "Four",
            rule: "Rule #4",
            title: "Hike Safely",
            description: "This one seems obvious right... kinda what we have been talking about this entire time. Let's just take a step back and look at the big picture. The essential things that will keep you safe on your average, everday day-hike include eating and drinking food and water, taking your time and watching where you walk, spraying for mosquitos and other nasty bugs, and of course ASK FOR HELP from a park ranger or a nearby hiker if you need it. Stay safe out there!"
        }
    ]

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
                                    <div className='mt-3' >
                                        {subList.map(({subTitle, subDescription}) => {
                                            return (
                                                <div>
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
                )
            })}
        </div>
    );
};

export default SafetyAccordian;