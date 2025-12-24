package com.example.courseapi;

import jakarta.persistence.*;

@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long userId;

    @Column(name = "first_name")
    private String first_name;

    @Column(name = "last_name")
    private String last_name;

    public User(){
    }

    public User(String first_name, String last_name){
        this.first_name = first_name;
        this.last_name = last_name;
    }


    public void setUserId(Long user_id) {
        this.userId = user_id;
    }

    public Long getUserId() {
        return userId;
    }


    public String getFirstName() {
        return first_name;
    }

    public void setFirstName(String firstName) {
        this.first_name = firstName;
    }

    public String getLastName() {
        return last_name;
    }

    public void setLastName(String lastName) {
        this.last_name = lastName;
    }
}