Form/Fields changes:
The dificulty will have three options: easy, medium, hard in greek, not numbers. i want the plant objects to have 3 date range fields. THe create form will have an add date range button below the current dat range one, max 3. also be able to remove one. also i want the user to be abel to drag and drop between them. the order of the date ranges will be saved in the db only when the user clicks save not when i drag and drop. this is only for UI. I also want plant object to have these fields: Αρωματικό, αναρηχητικο, Καλλωπιστικο, βρώσιμο (the existing food field), παχύφυτα, μικρό δέντρο, ιδιωτικότητας. these are boolean (if exist already make them boolean instead of string. these will be shown below the scientific name in the plant page. the phrase describing them will be adjusted if the value is true or false (for example for the food field φαγωσιμο if true and μη φαγωσιμο if false) . in the UI form the wind field will be below them. 
For the sunlight hours i want the user to be able to define the hours like this: a bar line with a dragable object on it that shows the prefered hour span in a day . like some product eshops have a price bar. the admin will be able to change the edges of the bar (the edges of the hour span meaning) and to move the whole bar if he drag it form its body. the whole span will be from 00:00 to 00:00 next day . the edges of the bar will be the current hour range fields. in the UI of the plant page the user will see this graph instead of just flower info just uneditbale. The codebase (in the client) will understand by the range if the object is mostly for morning light or noon light.
Now about lifecycle. I want to have these info the admin puts. One about how much time the plant leaves. the admin will see one small input with number and a dropdown that has options days, weeks, months, years , years by default. also  small button above it saying range (in greek) when user clicks the small input becomes bigger and has the initial value in the left , a- character in the middle and a free input on the right of it but for the user it seems like on. when user deletes the - with the backspace will return automatically to the one input state and will click the button if he wants to return to the range state. The final value will be like 4-6 weeks and be saved as string in the db.
Each stage of the lifecycle will have its own date field anout the time range of each stage exactly with the same logic and functionality as the whole lifspan date range field. add new field in the stage for this. i want one more boolean field for the stage object. the seed boolean field. thsi will be true and the stage is before the plant grow (εννοω οτι θα ιεναι αληθες οταν το σταδιο αφορα το φυτο πριν φτασει στο σημειο που μπορει να πυληθει ως μεταμφιτευμενο, οι χρηστες θελουν να ξερουν τα σταδια για το φυτο αν το απρουν ως σπορο και αν το παρουν ετοιμο απο ανθωπωλειο για αυτο τα θελω χωριστα). I want in the dashboard two buttons , one add seed stage and one add non seed stage. but the UI in the plant page will show the non seed stages just below the seed stages, so the admin must see them too. when the admin clicks non seed stage button will see the new stage input with diferent colour and below the last, when clicks new seed stage button will see the input below the last seed stage and above the fisrt non seed stage. also the time range will be the range from the seeding of the plant not date range neither. for example 6 moths - 12 months. meaning 6 months form plants seeding
In the user plant page UI the user will see one button μεταμφυτευση and από σπόρο
these will be one button taht just changes name and function each time the user clicks it. this button will just scroll in the correct stage. Also the user will see the stages like elements one below the other and an vertical left line connecting them, the range of the on the left side. right of the line. then max width on this with y scrollbar if stages are too many. initially the stages will just show time raneg and the name of the stage. in random moments the first line of the description field of the satge will appear below the name in the stage element to intrig user to click a see more button all the stages have. 
When user clicks see more button the whole page becomes the lifecycle, with the two μεταμφύτευση button at the bottom indication to scroll . also in this page all the stages description visible inside the elements. Also in this page and in the lifecycle graph the stages in odd number order will be a little pushed to the right.
Below the results put other results that dont meet characteristics but are secondarily related to some of the filters below a label.

the final plant fields:
- Ονομα (string, the regural name)
- ευρος τιμης (numbers, like now)
- απιστημονικο ονομα (string, the scientific name)
- ευρος ηλιου(number, like now)
- ευρος μηνων 1 (numbers, like now)
ευρος μηνων 2 (second if needed)
ευρος μηνων 3(third if needed)
wind (string, admin selects between values) 
kind (flowers, leaves, bush)

- βρψσιμο (boolean, true will show user φαγωσιμο false will not show it to user)
αναρηχιτικο (boolean, true shows αναρηχιτικο false doesnt show)
- περιοχη (string, like currenlty but with the name of the area which it is native)
παχυφυτο (boolean, true shows user παχια φυλλα, false shows λεπτα φυλα)
μικρο δεντρο (boolean, doesnt show user)
near sea (boolean , when true show user κοντα στη θαλασσα)
winter (boolean, if true then show ανθεκτικο στον παγετο, if false then the opposite)
ιδιωτικοτητας (boolean, true shows user ιδιωτικοτητα false doesn show, it is like for plant fence in houses)
καλλωπιστικο (boolean, καλλωπιστικο show if true . if false dont show)
- περιγραφη (string, like now)

Filters:
Initial 5 filters:
Size (one selection), sun hours(one selection), cost (one selection), characteristics multiple selection (wind (the selection here will just be checkbox boolean but will connect to the real four values of it), winter, near sea), kind (one selection)

Full filter bar:
All of the above but the wind will have the four values multiple selection, also a filter with a list of random boolean charactiricts (Βρωσιμο, αναρηχιτικο, παχυφυτο, καλλωπιστικο, ιδιωτικοτητας, μικρο δεντρο) multiple selection. sun hours (one for length and one of what part of the day in one seleciton), the season filter must adjust accordingly in the changes, kind also one seleciton filter.