"use strict";

const resetDB = require("../config/scripts/populateDB")

const Companion = require("./schema/Companion");
const Doctor = require("./schema/Doctor");
const FavoriteCompanion = require("./schema/FavoriteCompanion");
const FavoriteDoctor = require("./schema/FavoriteDoctor");

const express = require("express");
const router = express.Router();

// completely resets your database.
// really bad idea irl, but useful for testing
router.route("/reset")
    .get((_req, res) => {
        resetDB(() => {
            res.status(200).send({
                message: "Data has been reset."
            });
        });
    });

router.route("/")
    .get((_req, res) => {
        console.log("GET /");
        res.status(200).send({
            data: "App is running."
        });
    });
    
// ---------------------------------------------------
// Edit below this line
// ---------------------------------------------------
router.route("/doctors")
    .get((req, res) => {
        console.log("GET /doctors");

        // already implemented:
        Doctor.find({})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log("POST /doctors");
        
        Doctor.create(req.body).save()
            .then(data => {
                res.status(201).send(data);
            })
            .catch(err => {
                res.status(500).send({"message": 'Missing data or incorrect data type to create a new doctor!'});
            })
});

// optional:
router.route("/doctors/favorites")
    .get((req, res) => {
        console.log(`GET /doctors/favorites`);
        
        FavoriteDoctor.find({})
            .then(doctors => {
                const doctorIds = doctors.map(doctor => doctor.doctor)
                Doctor.find({_id: {$in: doctorIds}})
                    .then(data => {
                        res.status(200).send(data);
                    })
                    .catch(err => {
                        res.status(500).send(err);
                    })
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log(`POST /doctors/favorites`);
        
        if ("doctor_id" in req.body) {
            let doctorId = req.body["doctor_id"]
            FavoriteDoctor.find({doctor: doctorId})
                .then(doctorWithId => {
                    if (doctorWithId.length > 0) {
                        res.status(500).send({"message": 'Doctor with id \"${doctorId}\" already exists in favorite.'});
                    } else {
                        FavoriteDoctor.create(doctorId).save()
                            .then(_ => {
                                Doctor.findById(doctorId)
                                    .then(doctor => {
                                        res.status(201).send(doctor);
                                    })
                                    .catch(err => {
                                        res.status(404).send(`Doctor with id \"${doctorId}\" does not exist.`);
                                    })
                            })
                            .catch(err => {
                                res.status(500).send(err);
                            })
                    }
                })
                .catch(err => {
                    res.status(500).send({"message": `Doctor with id \"${doctorId}\" does not exist.`});
                })
            
        } else {
            res.status(500).send({"message": 'Missing doctor id!'});
        }
    });
    
router.route("/doctors/:id")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}`);
        
        let doctorId = req.params["id"]
        Doctor.findById(doctorId)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    })
    .patch((req, res) => {
        console.log(`PATCH /doctors/${req.params.id}`);
        
        let doctorId = req.params["id"]
        Doctor.findOneAndUpdate({_id: doctorId}, {$set: req.body}, { returnOriginal: false })
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /doctors/${req.params.id}`);
        
        let doctorId = req.params["id"]
        Doctor.deleteOne({_id: doctorId})
            .then(data => {
                res.status(200).send();
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    });
    
router.route("/doctors/:id/companions")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/companions`);
        
        let doctorId = req.params["id"]
        Companion.find({doctors: {$in: doctorId}})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    });
    

router.route("/doctors/:id/goodparent")
    .get((req, res) => {
        console.log(`GET /doctors/${req.params.id}/goodparent`);
        
        let doctorId = req.params["id"]
        Companion.find({
            $and: [
                {doctors: {$in: doctorId}},
                {alive: false}
            ]
        })
            .then(data => {
                if (data.length > 0) {
                    res.status(200).send(false);
                } else {
                    res.status(200).send(true);
                }
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    });

// optional:
router.route("/doctors/favorites/:doctor_id")
    .get((req, res) => {
        console.log("GET /doctors/favorites/:doctor_id");

        let doctorId = req.params["doctor_id"]
        FavoriteDoctor.findOne({doctor: doctorId})
            .then(favoriteDoctors => {
                if(favoriteDoctors != null) {
                    Doctor.findById(doctorId)
                        .then(doctor => {
                            res.status(200).send(doctor);
                        })
                        .catch(err => {
                            res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
                        })
                } else {
                    res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist in the favorite list.`});
                }
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist.`});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /doctors/favorites/${req.params.doctor_id}`);
        
        let doctorId = req.params["doctor_id"]
        FavoriteDoctor.deleteOne({doctor: doctorId})
            .then(data => {
                res.status(200).send();
            })
            .catch(err => {
                res.status(404).send({message: `Doctor with id \"${doctorId}\" does not exist in the favorite list.`});
            })
    });

router.route("/companions")
    .get((req, res) => {
        console.log("GET /companions");
        // already implemented:
        Companion.find({})
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log("POST /companions");
        
        Companion.create(req.body).save()
            .then(data => {
                res.status(201).send(data);
            })
            .catch(err => {
                console.log(err)
                res.status(500).send({"message": 'Missing data or incorrect data type to create a new companion!'});
            })
    });

router.route("/companions/crossover")
    .get((req, res) => {
        console.log(`GET /companions/crossover`);
        
        Companion.find({'doctors.1': {$exists: true}})
            .then(data => {
                res.status(200).send(data);
            })
    });

// optional:
router.route("/companions/favorites")
    .get((req, res) => {
        console.log(`GET /companions/favorites`);
        
        FavoriteCompanion.find({})
            .then(companions => {
                const companionIds = companions.map(companion => companion.companion)
                Companion.find({_id: {$in: companionIds}})
                    .then(data => {
                        res.status(200).send(data);
                    })
                    .catch(err => {
                        res.status(500).send(err);
                    })
            })
            .catch(err => {
                res.status(500).send(err);
            });
    })
    .post((req, res) => {
        console.log(`POST /companions/favorites`);
        
        if ("companion_id" in req.body) {
            let companionId = req.body["companion_id"]
            FavoriteCompanion.find({companion: companionId})
                .then(companionWithId => {
                    if (companionWithId.length > 0) {
                        res.status(500).send({"message": `Companion with id \"${companionId}\" already exists in favorite.`});
                    } else {
                        FavoriteCompanion.create(companionId).save()
                            .then(_ => {
                                Companion.findById(companionId)
                                    .then(companion => {
                                        res.status(201).send(companion);
                                    })
                                    .catch(err => {
                                        res.status(404).send(`Companion with id \"${companionId}\" does not exist.`);
                                    })
                            })
                            .catch(err => {
                                res.status(500).send(err);
                            })
                    }
                })
                .catch(err => {
                    res.status(500).send({"message": `Companion with id \"${companionId}\" does not exist.`});
                })
        } else {
            res.status(500).send({"message": 'Missing companion id!'});
        }
    })

router.route("/companions/:id")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}`);
        
        let companionId = req.params["id"]
        Companion.findById(companionId)
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    })
    .patch((req, res) => {
        console.log(`PATCH /companions/${req.params.id}`);
        
        let companionId = req.params["id"]
        Companion.findOneAndUpdate({_id: companionId}, {$set: req.body}, { returnOriginal: false })
            .then(data => {
                res.status(200).send(data);
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /companions/${req.params.id}`);
        
        let companionId = req.params["id"]
        Companion.deleteOne({_id: companionId})
            .then(data => {
                res.status(200).send();
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    });

router.route("/companions/:id/doctors")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/doctors`);
        
        let companionId = req.params["id"]
        Companion.findById(companionId)
            .then(aCompanion => {
                Doctor.find({_id: {$in: aCompanion.doctors}})
                    .then(data => {
                        res.status(200).send(data);
                    })
                    .catch(err => {
                        res.status(404).send({message: "Something went wrong."});
                    })
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    });

router.route("/companions/:id/friends")
    .get((req, res) => {
        console.log(`GET /companions/${req.params.id}/friends`);
        
        let companionId = req.params["id"]
        Companion.findById(companionId)
            .then(aCompanion => {
                Companion.find({
                    $and: [
                        {_id: {$ne: companionId}},
                        {seasons: {$in: aCompanion.seasons}}
                    ]
                })
                    .then(data => {
                        res.status(200).send(data);
                    })
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    });

// optional:
router.route("/companions/favorites/:companion_id")
    .get((req, res) => {
        console.log("GET /companions/favorites/:companion_id");

        let companionId = req.params["companion_id"]
        FavoriteCompanion.findOne({companion: companionId})
            .then(favoriteCompanion => {
                if(favoriteCompanion != null) {
                    Companion.findById(companionId)
                        .then(companion => {
                            res.status(200).send(companion);
                        })
                        .catch(err => {
                            res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
                        })
                } else {
                    res.status(404).send({message: `Companion with id \"${companionId}\" does not exist in the favorite list.`});
                }
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist.`});
            })
    })
    .delete((req, res) => {
        console.log(`DELETE /companions/favorites/${req.params.companion_id}`);
        
        let companionId = req.params["companion_id"]
        FavoriteCompanion.deleteOne({companion: companionId})
            .then(data => {
                res.status(200).send();
            })
            .catch(err => {
                res.status(404).send({message: `Companion with id \"${companionId}\" does not exist in the favorite list.`});
            })
    });

module.exports = router;