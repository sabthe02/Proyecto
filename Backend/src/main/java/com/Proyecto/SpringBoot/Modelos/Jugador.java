package com.Proyecto.SpringBoot.Modelos;

public class Jugador {

    public String id;
    public String nickName;
    public String team;


    public Jugador(String id, String nickName, String team) {
        this.id = id;
        this.nickName = nickName;
        this.team = team;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getNickName() {
        return nickName;
    }

    public void setNickName(String nickName) {
        this.nickName = nickName;
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    

}
