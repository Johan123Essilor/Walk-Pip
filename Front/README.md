# Hiking Trail Finder

The Hiking Trail Finder is a web application that allows users to explore and discover hiking trails, search for trails in a directory, rate and review trails, and authenticate users.

## Features

- **Trail Details**: View detailed information about hiking trails, including trail name, location, difficulty level, length, elevation gain, and description.
- **Trail Directory**: Search for hiking trails based on location, such as city or state. Browse through a list of trails.
- **Rating and Reviews**: Users can rate and leave reviews for trails they have hiked, providing valuable feedback to other users.
- **User Authentication**: Users can create accounts, log in, and manage their profile. Authentication ensures that only registered users can rate, review, and access certain features.
- **Interactive UI**: The application provides an intuitive and user-friendly interface, allowing users to navigate easily and find relevant information.

## Technologies Used

- **Frontend**: React.js, HTML, CSS, Bootstrap
- **Backend**: Node.js
- **Database**: MongoDB (future implementation, around June or July 2023)
- **APIs**: National Park Services API (for trail data), Google Maps API (for geocoding)
- **User Authentication**: JSON Web Tokens (JWT), bcrypt.js (for password hashing in the future)

## Setup and Installation

1. Clone the repository: `git clone https://github.com/yungtyyler/find-my-trail-react.git`
2. Navigate to the project directory: `cd find-my-trail`
3. Install dependencies: `npm install`
4. Set up environment variables:
   - Create a `.env` file in the root directory.
   - Add the required environment variables, such as API keys and database connection details.
5. Start the development server: `npm start`
6. Open your web browser and visit `http://localhost:3000` to access the application.

## Usage

1. Register for a new account or log in with existing credentials.
2. Explore hiking trails by browsing through the trail directory or using the search functionality.
3. View trail details to get more information about specific trails, including their location, difficulty level, length, and elevation gain.
4. Rate and review trails based on your hiking experience.
5. Update your profile information and manage your account settings.

## Future Enhancements

- **User Authentication**: Allow users to create a profile and leave ratings and reviews for trails.
- **Favorite Trails**: Allow users to save trails as favorites for quick access.
- **Trail Recommendations**: Provide personalized trail recommendations based on user preferences and past activity.
- **Trail Maps and Directions**: Integrate maps and directions to guide users to the trailhead.
- **Mobile Application**: Develop a mobile application for on-the-go access to hiking trail information.

## Contributing

Contributions to the Hiking Trail Finder project are welcome! If you have any ideas, improvements, or bug fixes, please submit a pull request. For major changes, please open an issue first to discuss the proposed changes.

When contributing to this repository, please ensure that you follow the [code of conduct](CODE_OF_CONDUCT.md).

## License

The Hiking Trail Finder project is licensed under the [MIT License](LICENSE).

## Acknowledgements

- National Park Services API for providing trail data
- Google Maps API for geocoding functionality

## Contact

For any inquiries or feedback, please contact the project maintainers:

- Tyler Varzeas - tyler.varzeas@gmail.com

Feel free to visit my website at https://tylervarzeas.com
