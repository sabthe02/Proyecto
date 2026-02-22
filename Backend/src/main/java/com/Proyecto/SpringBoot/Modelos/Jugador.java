package com.Proyecto.SpringBoot.Modelos;



import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;



@Entity
@Table(name = "jugadores")
public class Jugador {

    @Id
    private String id;

    private String nickName;

    private String team;

    public Jugador(String id, String nickName, String team) {
        this.id = id;
        this.nickName = nickName;
        this.team = team;
    }

    public Jugador() {

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
