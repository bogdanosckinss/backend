import { Injectable, StreamableFile } from '@nestjs/common';
import { DbService } from '../db/db.service'
import { ProfileDTO } from './dto/profile-d-t-o';
import { createReadStream } from 'fs';
import {writeFile} from 'fs';
import { promisify } from 'util';

@Injectable()
export class ContentService {
  constructor(private dbService: DbService) {}

  async updateVideoModerationStatus(data): Promise<any> {
    let dataToUpdate = {
      under_moderation: false,
      allowed: data.allowed
    }

    if (data.allowed) {
      dataToUpdate['preview_url'] = data?.previewImage ?? ''
    }

    return this.dbService.video.update({
      data: dataToUpdate,
      where: {
        id: data.videoId
      }
    })
  }


  async deleteVideo(videoId: string): Promise<any> {
    return this.dbService.video.update({
      where: {
        id: parseInt(videoId)
      },
      data: {
        under_moderation: false,
        allowed: false,
        deleted: true
      }
    })
  }

  async uploadContent(userId: number, data: ProfileDTO, videoId: number): Promise<any> {
    return this.dbService.user.update({
      where: {
        id: userId
      },
      data: {
        image: data.image,
        name: data.name,
        lastname: data.lastname,
        phone_number: data.phone_number.toString(),
        email: data.email,
        city: data.city,
        social_media_link: data.social_media_link,
        age: parseInt(String(data.age)),
        videos: {
          connect: {
            id: videoId
          }
        }
      },
    })
  }

  async uploadSong(data: any): Promise<any> {
    return this.dbService.song.create({
      data: {
        ...data
      }
    })
  }

  async getSongs(): Promise<any> {
    return this.dbService.song.findMany({
      orderBy: {
        id: 'desc'
      }
    })
  }

  async getVideosToModerate(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted
    ORDER BY video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted
    ORDER BY video.created_at DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getDeclinedVideosCount(): Promise<any> {
    const declinedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND NOT video.under_moderation AND NOT video.deleted`

    const acceptedVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE video.allowed IS TRUE AND NOT video.under_moderation AND NOT video.deleted`

    const underModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video
    WHERE NOT video.allowed AND video.under_moderation IS TRUE AND NOT video.deleted`

    const totalModerationVideosCount = await this.dbService.$queryRaw`
    Select COUNT(video.*) as countToShow from videos as video WHERE NOT video.deleted`

    if (!declinedVideosCount || declinedVideosCount == 'unknown') {
      return 0
    }

    // @ts-ignore
    return {
      accepted: parseInt(acceptedVideosCount[0]?.counttoshow ?? 0),
      declined: parseInt(declinedVideosCount[0]?.counttoshow ?? 0),
      underModeration: parseInt(underModerationVideosCount[0]?.counttoshow ?? 0),
      total: parseInt(totalModerationVideosCount[0]?.counttoshow ?? 0)
    }
  }

  async getApprovedVideos(skip: string): Promise<any> {
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed IS TRUE AND video.under_moderation IS FALSE
    ORDER BY video.id DESC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image,
          phone_number: video.phone_number,
          social_media_link: video.social_media_link
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
      }
    })
  }

  async getContent(id: number): Promise<any> {
    return {};
    // return this.dbService.video.findMany({
    //   //take: 3, // TODO: remove
    //   where: {
    //     id: {
    //       not: {
    //         lt: 6
    //       }
    //     },
    //     under_moderation: false,
    //     allowed: true
    //   },
    //   orderBy: {
    //     videoLikes: {
    //       _count: 'desc'
    //     }
    //   },
    //   include: {
    //     users: true,
    //     song: true,
    //     videoLikes: {
    //       select: {
    //         id: true,
    //         video_id: true,
    //         user: {
    //           select: {
    //             id: true,
    //           },
    //         },
    //       },
    //     }
    //   }
    // })
  }

  async findManyVideosByUsername(skip: string, query: string, userId: number, startVideoId: string): Promise<any> {
    const queryToUse = query == 'null' ? '' : query
    const videos = await this.dbService.$queryRaw`
    Select *, video.id as video_d, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id AND videoLike.user_id = ${userId}) as is_liked_by_me, (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) as video_likes from videos as video
    JOIN users as userc on video.user_id = userc.id
    JOIN song as ss on ss.id = video.song_id
    WHERE video.allowed AND (LOWER(CONCAT(userc.lastname, ' ', userc.name)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(CONCAT(userc.name, ' ', userc.lastname)) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(userc.name) LIKE LOWER(${'%' + queryToUse + '%'}) OR LOWER(ss.title) LIKE LOWER(${'%' + queryToUse + '%'}))
    ORDER BY (SELECT count(*) from video_likes as videoLike where videoLike.video_id = video.id) DESC, video.created_at ASC
    LIMIT 10 OFFSET ${parseInt(skip)}
    `

    if (!Array.isArray(videos)) {
      return []
    }

    return videos.map(video => {
      return {
        ...video,
        id: video.video_d,
        users: {
          name: video.name,
          lastname: video.lastname,
          city: video.city,
          age: video.age,
          email: video.email,
          image: video.image
        },
        song: {
          author_name: video.author_name,
          title: video.title,
          image_link: video.image_link
        },
        video_likes: '',
        is_liked_by_me: parseInt(video.is_liked_by_me) > 0,
        videoLikes: parseInt(video.video_likes)
      }
    })
  }

  async cleanUsers(query: string): Promise<any> {
    // let data = ''
    // readXlsxFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content/ert.xlsx').then(rows => {
    //   for (const row in rows) {
    //     data += ('"' + rows[row][0] + '",\n')
    //   }
    //   this.createFile('/Users/bohdanoskin/Documents/Other/extreme/domains/backend/src/content', 'er.txt', data);
    // })
    //
    // return
    // const queryToUse = query == 'null' ? '' : query
    // if (queryToUse == '') {
    //   return {}
    // }

    return await this.dbService.$queryRaw`
        Delete from users as usr
        WHERE usr.email IN(
                           'zhaemyullb@mail.ru',
                           'rodionov2011pasha04621j@myrambler.ru',
                           'smirnova.zo56s@rambler.ru',
                           'anechkavolkova-1981@ro.ru',
                           'nata140502@gmail.com',
                           'l.starostin.1970@ro.ru',
                           'yula-13@mail.ru',
                           'nrnhpqww@rambler.ru',
                           'lyubov-emelyanova-35-1996@bk.ru',
                           'nevinobuf@mail.ru',
                           'titov8ft0v@rambler.ru',
                           'mariya2191@mail.ru',
                           'magdalina-gorokhova-25-1999@inbox.ru',
                           'volchenko_2021@mail.ru',
                           'andrei-korizhin@yandex.ru',
                           'liudmilabogomolova.20@ro.ru',
                           'kiselev99jurij95971b@myrambler.ru',
                           'yekaterina-fadeeva-86@mail.ru',
                           'iaroslava2000starikova@ro.ru',
                           'romanov9aleksej98171h@myrambler.ru',
                           'egorov2012gena47292t@myrambler.ru',
                           'aleksandr-33@ro.ru',
                           'almira_galiaskarova@mail.ru',
                           'zhenjavinogradovjn9734@rambler.ua',
                           'farit.zaripov@mail.ru',
                           'smirnov2010roma05217w@myrambler.ru',
                           'ananiya.balashova.427.1997@inbox.ru',
                           'medvedev9oleg11849z@myrambler.ru',
                           'ogutulaiyla@rambler.ru',
                           'tgoxosije@autorambler.ru',
                           'yraplus@mail.ru',
                           'evtushenko.3iupj@rambler.ru',
                           'gorbunova-u41z3@rambler.ru',
                           'vtclmcnbhx@rambler.ru',
                           'sessipoludolnyia994916@rambler.ua',
                           'aminovaj5@gmail.com',
                           'arina.khomyakova.283.2005@bk.ru',
                           'roksanamsk@smykwb.com',
                           'vayanaranz@mail.ru',
                           'trenixina.darya@mail.ru',
                           'zieda5875@gmail.com',
                           'galya2@yandex.ru',
                           'adelina_golubeva-99-2004@mail.ru',
                           'frolov2002fedorgjho@list.ru',
                           'aldabayevam@mail.ru',
                           'litvinova.44.anzhelika@rambler.ua',
                           'alekseev100roman88811v@myrambler.ru',
                           'mohzoda95@mail.ru',
                           'rodionov2012konstantin25534p@myrambler.ru',
                           'ekstish@ya.ru',
                           'khaniyya.utkina_922-1998@inbox.ru',
                           'nozirjonovparviz637@gmail.com',
                           'lapshin1998@autorambler.ru',
                           'beliaeva_acloud31@rambler.ua',
                           'semenov.1is5x@rambler.ru',
                           'yulya.2020.orlova@mail.ru',
                           'takelsagjl@rambler.ru',
                           'olgakraisler@mail.ru',
                           '5740494282@ro.ru',
                           'leha.2013.nikitin@mail.ru',
                           'sosiska_pechka03@ro.ru',
                           'zinchenkoaa@bk.ru',
                           'iipfykqddv@autorambler.ru',
                           'valeriavip@mail.ru',
                           'egora13041983@gmail.com',
                           'anokhina19o6p@rambler.ru',
                           'rimmasaparova@mail.ru',
                           'artem.44@rambler.ua',
                           'maksim_shaklein@mail.ru',
                           'slepchik19981204@gmail.com',
                           'krivova.10@inbox.ru',
                           'lena.prokopenko.1998@mail.ru',
                           'zaya16.96@mail.ru',
                           'dashitsyrenova88@inbox.ru',
                           'anthonymoore10091970@rambler.ua',
                           'darya.2012.denisova@mail.ru',
                           'ms.ekaterina.yakusheva@mail.ru',
                           'nastya8826@bk.ru',
                           'martynov99zhenja99097m@myrambler.ru',
                           'asya.2023.tabikalova@mail.ru',
                           'samarina1998@rambler.ua',
                           'antonov99vlad05029q@myrambler.ru',
                           'adambin@inbox.ru',
                           'aleardshkiperov96806@ro.ru',
                           'evorosilova9@gmail.com',
                           'yggipzbql@autorambler.ru',
                           'na2939@yandex.ru',
                           'jay.livingston.91@list.ru',
                           'admiralova.marina@list.ru',
                           'evgeniavorosilova6@gmail.com',
                           'marina-komissarova-01@mail.ru',
                           'sumatohin28@gmail.com',
                           'krasoto4ka2410@gmail.com',
                           'viktordavydovtm3311@lenta.ru',
                           'kupahina@list.ru',
                           'odintsova-ritulya@bk.ru',
                           'staple.romanov.30@ro.ru',
                           'ilyushkin.07@list.ru',
                           'marina.2005.lyubimova@list.ru',
                           'stdi-77@mail.ru',
                           'noskova_ht83q@rambler.ru',
                           'anastasiasumm999@gmail.com',
                           'valeriakur0206@gmail.com',
                           'tarasov2011anatolij60409v@myrambler.ru',
                           'minaeva_valeriia_divata@autorambler.ru',
                           'galina9836@rambler.ru',
                           'shafikov_1989_shafikov@rambler.ua',
                           'aldabaevaml@mail.ru',
                           'barbaraphillips02121997@ro.ru',
                           'e.soucy@bk.ru',
                           'bhoyfizcut@rambler.ru',
                           'alavrencheeva@bk.ru',
                           'jovnerchikansel2187@autorambler.ru',
                           'nickolai.drozdow2015@yandex.ru',
                           'vorontsov1980@autorambler.ru',
                           'lyusya.shestakova.01@mail.ru',
                           'lara.2014.sorokina@mail.ru',
                           'timofa@gonetor.com',
                           'gnickle@bk.ru',
                           'kremleva.larisa@list.ru',
                           'anfinogenova2606@mail.ru',
                           'marina.2009.yefimova@bk.ru',
                           'artem_pernor_1979@rambler.ua',
                           'titov2011sasha42947t@myrambler.ru',
                           'goryunova.ameliya@bk.ru',
                           'derzhavina_yekaterina@list.ru',
                           'arshinskaya2012@yandex.ru',
                           'vasilev100vitalik69060j@myrambler.ru',
                           'malyshieva85@bk.ru',
                           'ruslanivanovlo9467@lenta.ru',
                           'skoryukina84@mail.ru',
                           'ksiu.1994@rambler.ua',
                           'marisobik@yandex.ru',
                           'swyajkw@autorambler.ru',
                           'verchenko.sofya@yandex.ru',
                           'l_jenny@list.ru',
                           'arina.2010.arina@bk.ru',
                           'marina.2011.rodionova@bk.ru',
                           'lizzaveta.86@mail.ru',
                           'e_shields@inbox.ru',
                           'volkova_5rbhv@rambler.ru',
                           'alisbekovaalena@gmail.com',
                           'maks1971@list.ru',
                           'ivashova.2025@list.ru',
                           'smykova2013@mail.ru',
                           'velistaya1988@mail.ru',
                           'ivanova9ciut@rambler.ru',
                           'markina1982@rambler.ru',
                           'dbnbldamwj@autorambler.ru',
                           'chernova.rayana@bk.ru',
                           'yurova971@gmail.com',
                           'apalinariyastolbova4355@rambler.ua',
                           'gerasimova_ameliya@inbox.ru',
                           'elena_ruban@bk.ru',
                           'severinass@mail.ru',
                           'iuliia-1993-vlasenko@autorambler.ru',
                           'konovalova.5fc7n@rambler.ru',
                           'petrovskayaviktoria1105@gmail.com',
                           'lyusi-kolesnikova_98-2001@inbox.ru',
                           'arzzanna@yandex.ru',
                           'tmzdjvz@autorambler.ru',
                           'david.calvo.4419503@rambler.ru',
                           'kiselev2010vjacheslav66657v@myrambler.ru',
                           'kisswingtipo967@mail.ru',
                           'aliska_ivanova_2007@list.ru',
                           'a.khushvakhtov@list.ru',
                           'khramova-kristina-wombed@rambler.ua',
                           'victoriyam1989@gmail.com',
                           'tanyakashenkova@gmail.com',
                           'chernyshev2000andrej42060j@myrambler.ru',
                           'nanaa73@mail.ru',
                           'vlad-borisov54416@rambler.ru',
                           'mahoney20@mail.ru',
                           'quinton.cedeno.8552026@rambler.ru',
                           'anyagavrilova0406@gmail.com',
                           'pushkinavarvara1@mail.ru',
                           'ruslana.malinina.15_1997@mail.ru',
                           '7152213133@ro.ru',
                           'konstantinstepanovcy6415@rambler.ru',
                           'n_nikon@mail.ru',
                           'pavlov2011pavel52082q@myrambler.ru',
                           'olesyafatkylina@gmail.com',
                           '23mikhail-ivanov23@rambler.ua',
                           'olgaegorova00000@yandex.ru',
                           'surinovahelga@gmail.com',
                           'renat1980.buisson42@rambler.ua',
                           'ibnyuran2415@rambler.ua',
                           'an.ge.li.na.kuz3@gmail.com',
                           'marina_stupina@list.ru',
                           'lyubimova.nika1996@mail.ru',
                           'ms.darya.fedorova@mail.ru',
                           'nastj_86@list.ru',
                           'vika2004pogodkina@mail.ru',
                           '93katrin@bk.ru',
                           'kulikov2012mihail61808p@myrambler.ru',
                           'tanybutakova@mail.ru',
                           'tihonova_lv93@mail.ru',
                           'svetlana.chutkov@mail.ru',
                           'a290791@yandex.ru',
                           '050483g@gmail.com',
                           'docenko_zhenya92@mail.ru',
                           'anastasiia.sattarova.25@ro.ru',
                           'elennkaz@mail.ru',
                           'snejanakarasal@mail.ru',
                           'nataliyashablaeva@mail.ru',
                           'arinabigeeva@gmail.com',
                           'natali_120883@mail.ru',
                           'mankyk@gmail.com',
                           'rezon7@yandex.ru',
                           'rassosha777@mail.ru',
                           'konstantinova_crosier29@ro.ru',
                           'polosmak89@mail.ru',
                           'ivanova.e20mh@rambler.ru',
                           'cherepanova.alen@mail.ru',
                           'juliasalnikova17@mail.ru',
                           'kristofer83@mail.ru',
                           'sashulya_94@mail.ru',
                           'irinagusina809@gmail.com',
                           'oli4ka_vip_@mail.ru',
                           'ab9131100909@yandex.ru',
                           'davidovna8613@mail.ru',
                           'sidikovhairulla86@gmail.com',
                           'sobolek82@bk.ru',
                           'katrin_dnew@mail.ru',
                           'tanycha.t83@gmail.com',
                           '06aan@mail.ru',
                           'ambrela1989.89@mail.ru',
                           'luchschewa.a@yandex.ru',
                           'manechk@mail2000.ru',
                           'nazarov100vlad67995a@myrambler.ru',
                           'yunkina1989@mail.ru',
                           'druzhinina.43asg@rambler.ru',
                           'n.selina270@gmail.com',
                           'sveta_drofa@mail.ru',
                           'aidanatadinova150799@gmail.com',
                           'hmelevairina0211@gmail.com',
                           'mikhaylova-adelina1997@mail.ru',
                           'e-silivanova@yandex.ru',
                           'wtkhwvtkxs@autorambler.ru',
                           'tchertovka89@mail.ru',
                           'indenokulia@gmail.com',
                           'yaqubovagulnar85@gmail.com',
                           '62442al@gmail.com',
                           'vladapestova1@mail.ru',
                           'amani_vlasova-69_2003@inbox.ru',
                           'sat_m91@list.ru',
                           'bederjulia@mail.ru',
                           'madaliyeva94@mail.ru',
                           'ruzilkakadrova@gmail.com',
                           'yekaterina_kuzmina_2002@inbox.ru',
                           'samrajnatala34@gmail.com',
                           'lenusik27886@yandex.ru',
                           'nikolaev2000ivan22898h@myrambler.ru',
                           'borodina.a97@mail.ru',
                           'drobininan453@gmail.com',
                           'lyubov.vorontsova.2024@mail.ru',
                           'sizykhtanya96@gmail.com',
                           'galina.gribenchikova@yandex.ru',
                           'ernikh@mail.ru',
                           'irinakorovyakovskaya@yandex.ru',
                           'lina.fagara@ro.ru',
                           'pogranec485@mail.ru',
                           'metod_ugl@mail.ru',
                           'ryabininadya@ya.ru',
                           'suslov.purging22@autorambler.ru',
                           'vera.2018.veselova@bk.ru',
                           'ksyu.turn@mail.ru',
                           'sabashnikovakalb6709@ro.ru',
                           'lyubimova_amina@inbox.ru',
                           'lakomka20042004@mail.ru',
                           'chernov100aleksej39834r@myrambler.ru',
                           'nataljanovikova3@gmail.com',
                           'svetikpatap1983@gmail.com',
                           'triksabuzerov@bk.ru',
                           'shamrylo_santa_1964@ro.ru',
                           '8484silver@mail.ru',
                           'akimov.bm7uw@rambler.ru',
                           'mailstylestones@gmail.com',
                           'borisova-resbol@yandex.ru',
                           'elena0703kiryuhina@yandex.ru',
                           'mgravitskiy@bk.ru',
                           'kardoagent01@gmail.com',
                           'nrpuq7ugcc@rambler.ru',
                           'ksraevskix92@bk.ru',
                           'ufimtsev-3yvrs@rambler.ru',
                           'lenusik_1987@mail.ru',
                           'mail-eva@mail.ru',
                           'gerasyutinaketevan8852@autorambler.ru',
                           'elena-ordinarcev@mail.ru',
                           'ryabykh.varia@gmail.com',
                           'mandiana890@gmail.com',
                           'iosiya.ermolova_85_1996@list.ru',
                           'improves@mail.ru',
                           'lyusi_mikheeva-39.2002@inbox.ru',
                           'lyudmila_kukushkina-76_1996@bk.ru',
                           'regina.2022.kozyreva@mail.ru',
                           'anna.bezborodova.96@mail.ru',
                           'vasilijfilippovix4470@rambler.ua',
                           'alison.medvedeva@gmail.com',
                           'gdakova1990@jmail.com',
                           'parnevova@mail.ru',
                           'vlasova.marina.1978@mail.ru',
                           'arabboevma@gmail.com',
                           'komarov9valik58015x@myrambler.ru',
                           'lauralopez20121999@autorambler.ru',
                           'gulichka369@mail.ru',
                           'kse82@mail.ru',
                           'jakalinamaksimyuka1999@ro.ru',
                           'gorgeomsk@gonetor.com',
                           'vladimir-1989-abakumov@rambler.ua',
                           'tkrotovy@mail.ru',
                           'galimzanovagulnara1974@gmail.com',
                           'sophia1989@mail.ru',
                           'a80lenka@yandex.ru',
                           'milaniya001@somelora.com',
                           'kuzakovrusian18@gmaii.com',
                           'daria90_@mail.ru',
                           'veronikakondratovich14@gmail.com',
                           'bfugiol@rambler.ru',
                           'lyubava_parfenova-06.2004@bk.ru',
                           'kozlova-4sgb1@rambler.ru',
                           'evdokimovadara892@gmail.com',
                           'dima-chang-1987@rambler.ua',
                           'sajhulislamovaajsylu@gmail.com',
                           'ashurkovamiyassar91@autorambler.ru',
                           'vakhitov_lawton_21@ro.ru',
                           'kapitanov888@mail.ru',
                           'docha2003@mail.ru',
                           'fedotov2010misha37223m@myrambler.ru',
                           'ewgeniya2001@mail.ru',
                           'ivanov2012vladimir34033r@myrambler.ru',
                           'stacia-8888@mail.ru',
                           'qfot304zic@rambler.ru',
                           'ariabkova@u-energo.ru',
                           'anna.2016.loginova@mail.ru',
                           'olgatyutereva1983@gmail.com',
                           'vladimir1997egorov@rambler.ua',
                           'valentinsemenovst7934@lenta.ru',
                           'ivy.adams.135764@ro.ru',
                           'ilyuhazolotarev@yandex.ru',
                           'marisol85ka@mail.ru',
                           'saenko20102010@mail.ru',
                           'bnale8hcuu@rambler.ru',
                           'vera.2017.romanova@list.ru',
                           'shpikovka@mail.ru',
                           'varvaratutereva4@gmail.com',
                           'vyacheslav.sk@mail.ru',
                           'grigorijabramovmu1185@lenta.ru',
                           'ksenyazemtsova@yandex.ru',
                           'wbmcrhkzpq@rambler.ru',
                           'malgina-olga@mail.ru',
                           'astanakulovahanifa532@gmail.com',
                           'sonya_pastushenko@mail.ru',
                           'tanya.2009.kolesnikova@mail.ru',
                           'ushakovaaa2012@gmail.com',
                           '7770203@rambler.ru',
                           'herem_suvorov_23@autorambler.ru',
                           'kirilova.yana@inbox.ru',
                           'vlasov2000valerij66919h@myrambler.ru',
                           'lawyer2010@bk.ru',
                           'korol.angelina2007@gmail.com',
                           'maslov2010maks43097x@myrambler.ru',
                           'vasilev2012vasilij83975r@myrambler.ru',
                           'chimmed.kulagin@yandex.ru',
                           'shirchenko80@mail.ru',
                           'lyubava.mukhina.26.2002@bk.ru',
                           'tanya02@mail.ru',
                           'tanya_2000_guseva@mail.ru',
                           'sashkasenin_1988@ro.ru',
                           'kika42175@gmai.com',
                           'dzhozef.2001.belskii@autorambler.ru',
                           'fd1mbz3o05jn@rambler.ru',
                           'ponomarev9kostja32176l@myrambler.ru',
                           'gorimir_sadovskii_1979@ro.ru',
                           'likarazvalaeva@gmai.com',
                           'milya_116@mail.ru',
                           'golubev-62jzo@rambler.ru',
                           'nastia-1980-naumova@rambler.ua',
                           'grechushkina2111@gmail.com',
                           'koljasolovevzx2872@lenta.ru',
                           'ninel_efremova.88-2005@list.ru',
                           'gajnitdinovaaelita44@gmail.com',
                           'mm3626754@gmail.com',
                           'svetlana1979@autorambler.ru',
                           'jurijsolovevws2880@lenta.ru',
                           'nastyanikolenko1987@gmail.com',
                           'elizavetamanoskina@gmail.com',
                           'katiamitrofanova-1996@rambler.ua',
                           'pipchenko1979@inbox.ru',
                           'iunusova.exsert43@rambler.ua',
                           'ritulya.2021.vorontsova@mail.ru',
                           'ksenia-panferova30@mail.ru',
                           'lyudmila-voronina_07_2005@bk.ru',
                           'missis.lybkowskaia@yandex.ru',
                           'nvntextureq@autorambler.ru',
                           'sorokacarrr@gmail.com',
                           'a_polonskii_84@autorambler.ru',
                           'vladislavsorokin_1993@autorambler.ru',
                           'maral_gunusova@mail.ru',
                           'tanyshka527000@gmail.com',
                           'salnikova_dashulya@bk.ru',
                           'sabina27121988@gmail.com',
                           'stas.razvalaev@gmail.com',
                           'uskovaana468@gmail.com',
                           'popovasl4kr@rambler.ru',
                           'arlenzaz09@mail.ru',
                           'chekpakova@mail.ru',
                           'mariaulanova769@gmail.com',
                           'karmen-uspenskaya.704.1999@bk.ru',
                           'cavynejw@autorambler.ru',
                           'snowkot@rambler.ru',
                           'nina-hordunova65@mail.ru',
                           'nauval_gorshkova.28-1996@list.ru',
                           'edwardhernandez23071980@rambler.ua',
                           'huyendao10082@gmail.com',
                           'eliana.wallace.569201@ro.ru',
                           '312koval@gmail.com',
                           'ivanov-1983-ivanov@rambler.ua',
                           'vasilev2012pasha04019q@myrambler.ru',
                           'yulia-tolstenko@mail.ru',
                           'los.basket.71@mail.ru',
                           'grigorijlazarevja4189@lenta.ru',
                           'kazakov99grisha08532o@myrambler.ru',
                           'iaroslav2000.lotase21@rambler.ua',
                           'komarov99vanja85409a@myrambler.ru',
                           'tarassmirnovlx7972@rambler.ua',
                           'dyadyloms@gmail.com',
                           'elvira-likhachyova_415-2002@list.ru',
                           'belayanas1985@mail.ru',
                           '89378741355@mail.ru',
                           'pushkina25-2@mail.ru',
                           'donna.salazar.92@inbox.ru',
                           'larisa_.92@mail.ru',
                           'y.varshavina@list.ru',
                           'smarkoidze@list.ru',
                           'oksana.zhigalova.79@mail.ru',
                           'hnsjdjjd@inbox.ru',
                           'pavlov2012pasha70347o@myrambler.ru',
                           'boldin.boris@inbox.ru',
                           'zima25-2@mail.ru',
                           'melnikov2011valerij74865j@myrambler.ru',
                           'omina-saidova@mail.ru',
                           'yeva-2011-kulikova@mail.ru',
                           'feopistiya_ermolova_247.2005@bk.ru',
                           'bagsaida@mail.ru',
                           'pashasemenovtq8310@rambler.ua',
                           'liza-koza-liza@yandex.ru',
                           'lerakorikova9999@gmail.com',
                           'angelllok_87@mail.ru',
                           'maksimova_e@chimmed.ru',
                           'aynur.shukurova89@mail.ru',
                           'staysi.7@mail.ru',
                           'ivan_travkin04@mail.ru',
                           'svbszr@yandex.ru',
                           'shlyapa1995@list.ru',
                           '1268198051@ro.ru',
                           'natasha-1994@ro.ru',
                           'alena.shishova.93@mail.ru',
                           'sofiya.2012.orlova@bk.ru',
                           'avselikhova@gmail.com',
                           'mahnigarcarstvenyia90@lenta.ru',
                           'katizaides@yandex.ru',
                           'utcugrm@rambler.ru',
                           'anna.zamyslova96@mail.ru',
                           'natashka.rodina@bk.ru',
                           'zezina74@mail.ru',
                           'lomadze.ucha@inbox.ru',
                           'alya.2021.tarasova@mail.ru',
                           'sofia141286@mail.ru',
                           'hares.hares@list.ru',
                           'franovaanastasia@gmail.com',
                           'polina.2003.melnikova@bk.ru',
                           'sofia-1704@mail.ru',
                           'smeshcheryakovv@list.ru',
                           'stellaiter@inbox.ru',
                           'chashchina_tatyana87@mail.ru',
                           'mininacz3w0@rambler.ru',
                           'dneizvestnno@list.ru',
                           'baranov99sasha83022s@myrambler.ru',
                           'kseniaivaskina442@gmail.com',
                           'kira_amosova@list.ru',
                           'filaretovv@rfcdrive.com',
                           'ruslanchernovst3108@rambler.ua',
                           'vmnmiracle@mail.ru',
                           'efremova82@inbox.ru',
                           'gruzinaiulia75@mail.ru',
                           'etatyna@list.ru',
                           'vip.nikolaeva1988@bk.ru',
                           'olesya.koptelina@mail.ru',
                           'kazakov99aleksandr61934k@myrambler.ru',
                           'bazhenova_susanna@inbox.ru',
                           'cigankova10011988@gmail.com',
                           'myrka_1@bk.ru',
                           'dzhamilya-kabanova-34_2001@inbox.ru',
                           'kymishevafarida@gmail.com',
                           'lyubovahmadeeva2@gmail.com',
                           'olg508@yandex.ru',
                           'denisfilippovoz2251@rambler.ru',
                           'snacgu010292@mail.ru',
                           'lubov.gontareva1999@gmail.com',
                           'olesya12049696@mail.ru',
                           'zhenjanikitinhx0098@rambler.ua',
                           'kess220@yandex.ru',
                           'grigorijsavelevsp6816@rambler.ua',
                           'zakharov.4pjke@rambler.ru',
                           'vasa40640@gmil.com',
                           'elizaveta.kuzmina.94-1999@inbox.ru',
                           'alenanegin@gmail.com',
                           'bokievanodira998@gmail.com',
                           'sanjasmirnovct9706@rambler.ua',
                           'valisevskaaira7@mail.ru',
                           'miranda_saveleva_68.2000@list.ru',
                           '89878839591@mail.ru',
                           'olga_golubeva_2004@mail.ru',
                           'stepanovaveronika2010@yandex.ru',
                           'kuznetsova_07.08@mail.ru',
                           'dari.drobitko@yandex.ru',
                           'solyanovapozdeya@bk.ru',
                           'mascha_div@mail.ru',
                           'olga.pogonecz@mail.ru',
                           'ewnikp31@yandex.ru',
                           'almirababaeva@gmail.com',
                           'nastyaonion197.52@gmail.com',
                           'chernov2010vitalik87708k@myrambler.ru',
                           'pervova.72@yandex.ru',
                           'valentina_chupina@mail.ru',
                           'belostockaanatala8@gmail.com',
                           'mikhonoshina066@mail.ru',
                           'muxametyanovar@list.ru',
                           'olgha_sokolova_79@mail.ru',
                           'xomenko_katrin@mail.ru',
                           'yarik198908@gmail.com',
                           'aigul_iaz@mail.ru',
                           'eugeniya180@yandex.ru',
                           'jonguishes@autorambler.ru',
                           'zyleva87@bk.ru',
                           '19verynja92@mail.ru',
                           'elenkofeliz@gmail.com',
                           'subhankulovafarida@yandex.ru',
                           'rudometova.alfiya@mail.ru',
                           'sofiyagovnosova@smykwb.com',
                           'zajcev2012vadim79333y@myrambler.ru',
                           'puma19892111@mail.ru',
                           'mariaisakova3197@gmail.com',
                           'omodlo@bk.ru',
                           'anya.fly8@gmail.com',
                           'natalya-visla@mail.ru',
                           'brokenangel1404@bk.ru',
                           'rosenman.yanina@gmail.com',
                           'katerina59russ@rambler.ru',
                           'gainullinaksenia@yandex.ru',
                           'vip.nds198@mail.ru',
                           'vikaruhvarg@gmail.com',
                           'anastasiashumihina1997@gmail.com',
                           'vladlena-grishina_60.2003@list.ru',
                           'lukasovaanastasia@gmail.com',
                           'pyatkova.mariya.99@mail.ru',
                           'kate-na.123@mail.ru',
                           'demischnina@mail.ru',
                           'ainach1987@mail.ru',
                           'ooowoow@mail.ru',
                           'gayduk79@mail.ru',
                           'abramov2010evgenij24798g@myrambler.ru',
                           'golovko-t@mail.ru',
                           'eslimak@inbox.ru',
                           'a.shibaeva80@mail.ru',
                           'darja59@mail.ru',
                           'kukla1992.natalya05@mail.ru',
                           'olesyashvagdina@mail.ru',
                           'aminagulamova007@gmail.com',
                           'zolotce777_zolot@mail.ru',
                           'miroshnikova-alena@mail.ru',
                           'aydakovav@mail.ru',
                           'fasxutdinova1987@mail.ru',
                           'pinkluntik.888@mail.ru',
                           'gayda_kirillova-65-2002@inbox.ru',
                           'ssafareeva@mail.ru',
                           'esmurodovamarzona33@gmail.com',
                           '35putina@mail.ru',
                           'martynova-rena@mail.ru',
                           'aniknt@mail.ru',
                           'zenechka-96@mail.ru',
                           'mns1989@mail.ru',
                           'tanyhkapopova91@mail.ru',
                           '9856232756@ro.ru',
                           'valieva.rozalli@mail.ru',
                           'cherry_mag@mail.ru',
                           'lyuba.pestrikova22.04.91@mail.ru',
                           'ovmanenkova@mail.ru',
                           'tscverkova@mail.ru',
                           'lazhskaya@mail.ru',
                           'guliata17@gmail.com',
                           'agleulina92@mail.ru',
                           'nekrasova.evgeniya2018@yandex.ru',
                           'gulschat2018@gmail.com',
                           'korobeynikova-85@mail.ru',
                           'svetlay-85@yandex.ru',
                           'zaripovaguzel1986@gmail.com',
                           'oktava2011@mail.ru',
                           'ziagulkalbaeva@gmail.com',
                           '9530550956@mail.ru',
                           'anastasya.pesnina@yandex.ru',
                           'sups08@mail.ru',
                           'grebneva960@mail.ru',
                           'map3689@gmail.com',
                           'e.tuckalowa@yandex.ru',
                           'markiza300178@gmail.com',
                           'todieforkat@gmail.com',
                           'ms.sc1997@mail.ru',
                           'nadasuspanova641@gmail.com',
                           '2013ska@mail.ru',
                           'tanyaxxx@mail.ru',
                           'mshhavkunova@mail.ru',
                           'vitalikmarkovyx3435@rambler.ua',
                           'tvt22@bk.ru',
                           'marinasunagatullina@gmail.com',
                           'cfadioteletyp@ro.ru',
                           'vitalijnovikovdt2402@lenta.ru',
                           'ajgildinaanna91@gmail.com',
                           'oksanakb977sasha@gmail.com',
                           'pulkat8383@yandex.ru',
                           'irinabrecht89@gmail.com',
                           'vladimira_kirillova_10.2005@inbox.ru',
                           'kseniachernitskaya@gmail.com',
                           'katerinka-bruk@yandex.ru',
                           'olesya140197@mail.ru',
                           'vasjawerbakovvg3184@lenta.ru',
                           'mgutik@gmail.com',
                           'canewa.marija@yandex.ru',
                           'alfiyasun@bk.ru',
                           'nigoraalkosimova@gmail.com',
                           'vitalijvlasovbq1896@lenta.ru',
                           'olgalubonenko@mail.ru',
                           'svetasever2010@mail.ru',
                           'mira.kras2013@mail.ru',
                           'voronina1982@autorambler.ru',
                           'anastasiataskaeva20@gmail.com',
                           'annadum@vafyxh.com',
                           'sydykovamahpurat@gmail.com',
                           'andreydrt6@rambler.ru',
                           'gulzamalberdigulova5@gmail.com',
                           'sonyafit@mail.ru',
                           'jurijmaksimovrj9367@lenta.ru',
                           'zemfirarafikova406@gmail.com',
                           'pavel.malyshko.13@mail.ru',
                           'katrina06042016@gmail.com',
                           'irinahamzina72@gmail.com',
                           'zhdanova.x943n@rambler.ru',
                           'arinamahnova2014@gmail.com',
                           'nelli-fadeeva.76-2002@inbox.ru',
                           'esin6818@gmail.com',
                           'gziazetdinova35@yandex.ru',
                           'embulaeva1302@gmail.com',
                           'albinasolntse@yandex.ru',
                           'olgasherstneva@rambler.ru',
                           'vladislava.elizarova151@mail.ru',
                           'tsarskaia@mail.ru',
                           'marishka-kasevich@yandex.ru',
                           'nik_karnishow@mail.ru',
                           'yangildina86@bk.ru',
                           't43887470@gmail.com',
                           'dr-888danilka@mail.ru',
                           'antonova.tania@bk.ru',
                           'huggykac@yandex.by',
                           'ruslandzucati12@gmail.com',
                           'lk415@mail.ru',
                           'rajabgultoshova@mail.ru',
                           'nina-shav@mail.ru',
                           'olesya.2010.potapova@bk.ru',
                           'nastya0703@mail.ru',
                           'nechaj.kristina@bk.ru',
                           'irina-sh87@mail.ru',
                           'dyrnochkina.taty@gmail.com',
                           'ekaterina8987@yandex.ru',
                           'liman-kseniya@mail.ru',
                           'vys-sofya@mail.ru',
                           'goncharova.zs8h3@rambler.ru',
                           'martimelle@yandex.ru',
                           'nastya-matsnaya@mail.ru',
                           'solnishko_09_92@mail.ru',
                           'mushira_danilova-46-2005@inbox.ru',
                           'zenyagaleeva@mail.ru',
                           'a-ashixmina@mail.ru',
                           'ponomarev100mihail42171o@myrambler.ru',
                           'arstanovavalentina9@gmail.com',
                           'rbqqasgzxl@rambler.ru',
                           'lelya.babakina@inbox.ru',
                           '2404.olga.a@mail.ru',
                           'maksim1996.mitered25@ro.ru',
                           'dashusik_83@mail.ru',
                           'bestuzevaksenia559gmail.com@mail.ru',
                           'magmet2005@gmail.com',
                           'charlene_mullen_1997@list.ru',
                           'marika@knmcadibav.com',
                           'innagimmy@qejjyl.com',
                           'suljenkoazilla@autorambler.ru',
                           'petjalebedevin2122@rambler.ua',
                           'pcymbcat@autorambler.ru',
                           'dmitrijgolubevub1504@rambler.ua',
                           'matveev2000tolik88900f@myrambler.ru',
                           'vlasov100jura60238q@myrambler.ru',
                           'vanjatarasovyv0221@rambler.ua',
                           'nazarov2000ilja37525g@myrambler.ru',
                           'pfreelectric@autorambler.ru',
                           'prohorov99vadik01675a@myrambler.ru',
                           'maksimkomarovwv8566@rambler.ua',
                           'valerijsorokinzt2773@rambler.ua',
                           'mariagucirieva@smykwb.com',
                           'dexsuht@rambler.ru',
                           'valiknovikovoa8314@rambler.ua',
                           'beljaev2010petr35037g@myrambler.ru',
                           'viktorpupov@gonetor.com',
                           'aleksandrkarpovjs9518@rambler.ua',
                           'pnzoxbersv@autorambler.ru',
                           'markroberts5608@rambler.ru',
                           'aleksandrkodxz3@rambler.ru',
                           'goodpavel@dygovil.com',
                           'kostjajakovlevdq7032@rambler.ua',
                           'ponomarevromanoi6071@rambler.ru',
                           'savelev99nikita23342t@myrambler.ru',
                           'maksimkarpovrw0716@rambler.ua',
                           'valentinvasilevxg7872@rambler.ua',
                           'dimanazarovbl0435@rambler.ua',
                           'toljamakarovtm1972@rambler.ua',
                           'osipov99oleg58681z@myrambler.ru',
                           'uynlmfidpf@rambler.ru',
                           'qncbzubcem@rambler.ru',
                           'r50dvuyvfw@knmcadibav.com',
                           '26d4cd3f5b@mailmaxy.one',
                           'sanjaromanoves4125@rambler.ua',
                           '6jo0uadh5z@rfcdrive.com',
                           'fomin100leha69489g@myrambler.ru',
                           'a9j1jv84o7@qacmjeq.com',
                           '91c602b186@mailmaxy.one',
                           'znytmblrd@autorambler.ru',
                           '9by3op4a48@smykwb.com',
                           'll86pkt489@vafyxh.com',
                           'c8b9fb8005@mailmaxy.one',
                           '8dcaa494e3@mailmaxy.one',
                           'vasilev2010mihail41787p@myrambler.ru',
                           'hevj3dbfbv@qzueos.com',
                           '6519ed748d@mailmaxy.one',
                           'a2a5653sv9@tippabble.com',
                           'nikolaev9pavel25451u@myrambler.ru',
                           'sidorov100vjacheslav16718j@myrambler.ru',
                           'wv7siht8a6@zvvzuv.com',
                           'hfredriksen@list.ru',
                           'medvedev99bogdan42820s@myrambler.ru',
                           '0fa245a436@mailmaxy.one',
                           'leonidwerbakovxm8814@rambler.ua',
                           'borisvasilevsk9242@rambler.ua',
                           'k4g34fhsy0@bltiwd.com',
                           'pgwyjblzmv@gonetor.com',
                           '887c215c8a@mailmaxy.one',
                           'x6p0rk4ibo@rambler.ru',
                           '19f152fd85@mailmaxy.one',
                           '0dcceeb513@mailmaxy.one',
                           '39bf701c04@mailmaxy.one',
                           '5ae5682492@mailmaxy.one',
                           '23afc4e177@mailmaxy.one',
                           'aiperijannat@jmail.com',
                           'e55b0890ec@mailmaxy.one',
                           'vasilijchernovky6305@rambler.ua',
                           'dd25a228ca@mailmaxy.one',
                           'alexandrov-ab@kantet.com',
                           'altmhjckkf@rambler.ru',
                           '183ff688a1@mailmaxy.one',
                           '38b9d0812c@mailmaxy.one',
                           'adarimclam1970@rambler.ru',
                           '19979108a2@mailmaxy.one',
                           'cb6ffd77d7@mailmaxy.one',
                           'deniskiselevsd6565@rambler.ua',
                           '57e452d7e1@mailmaxy.one',
                           'iboeuaqxui@rambler.ru',
                           '61b88c5718@mailmaxy.one',
                           'nevet@rambler.ru',
                           '2ab809b07c@mailmaxy.one',
                           'makspavlovbf5415@rambler.ua',
                           'c24157683d@mailmaxy.one',
                           '2d2acdd4e4@mailmaxy.one',
                           '7e1d082838@mailmaxy.one',
                           '85cb2e4f8d@mailmaxy.one',
                           '1b22200fb6@mailmaxy.one',
                           '67a5f915d0@mailmaxy.one',
                           '903fbd5761@mailmaxy.one',
                           '7e449d2dd5@mailmaxy.one',
                           '806e889c05@mailmaxy.one',
                           '7b5552d0f8@mailmaxy.one',
                           '1d770c48e7@mailmaxy.one',
                           '610da09cd9@mailmaxy.one',
                           '17bc69dc86@mailmaxy.one',
                           'f0fa26c4d0@mailmaxy.one',
                           'cce631e563@mailmaxy.one',
                           'chernyshev2011vova04383a@myrambler.ru',
                           '4a523f2b1e@mailmaxy.one',
                           'f7bb3de574@mailmaxy.one',
                           '3e18e12e1e@mailmaxy.one',
                           'f920745c67@mailmaxy.one',
                           'frolov2000slava48388t@myrambler.ru',
                           '973695450a@mailmaxy.one',
                           '35ca4da629@mailmaxy.one',
                           'aec0fdc6d6@mailmaxy.one',
                           'zamiatina8la8f@rambler.ru',
                           '8065a0eea1@mailmaxy.one',
                           '98753986b2@mailmaxy.one',
                           'pavlov9vitalik64964l@myrambler.ru',
                           '38419a7d28@mailmaxy.one',
                           'd54c7bc885@mailmaxy.one',
                           '010ebcf327@mailmaxy.one',
                           'df0615af86@mailmaxy.one',
                           '30bf09d01e@mailmaxy.one',
                           '3dfaa8da41@mailmaxy.one',
                           'caa3676e56@mailmaxy.one',
                           '64b191e28f@mailmaxy.one',
                           'dorit.brown@solarnyx.com',
                           '0baaa6eb64@mailmaxy.one',
                           'd7f5656d8d@mailmaxy.one',
                           '2f88d7c291@mailmaxy.one',
                           'jakirah.illingworth@easymailer.live',
                           'sidorov2010roma25772a@myrambler.ru',
                           '247eab4e8b@mailmaxy.one',
                           'ivanov2010andrej57275y@myrambler.ru',
                           '200888cc10@mailmaxy.one',
                           '2bb26e6043@mailmaxy.one',
                           'paquita.goding@allwebemails.com',
                           '4e92f69200@mailmaxy.one',
                           'denisov99bogdan52043l@myrambler.ru',
                           'f13943de3e@mailmaxy.one',
                           '4f65121df7@mailmaxy.one',
                           'keysa.cudd@solarnyx.com',
                           'fa01f7cc08@mailmaxy.one',
                           'f60e41d711@mailmaxy.one',
                           'damante.whitney@inboxorigin.com',
                           'e74b04da68@mailmaxy.one',
                           '046sgrc5kg@spymail.one',
                           'markiyah.nally@horizonspost.com',
                           '492a41e4a6@mailmaxy.one',
                           'bogdanov2000vova36628q@myrambler.ru',
                           '04ezfy7f64@freeml.net',
                           '06ba3e03e5@mailmaxy.one',
                           '0a84a871ba@mailmaxy.one',
                           'dishan.lundquist@solarnyx.com',
                           'sopypamipuf2@10mail.xyz',
                           'kostjalebedevsk4692@rambler.ua',
                           'a8f6c9f954@mailmaxy.one',
                           'yjcncxezh@emlpro.com',
                           'ahhvqgswk@10mail.org',
                           'ife.raines@allwebemails.com',
                           '046sh9etar@spymail.one',
                           '7dbfd326ca@mailmaxy.one',
                           '4ea96b16e9@mailmaxy.one',
                           'ehan.merry@openmail.pro',
                           'uivnmfhzh@emlpro.com',
                           '6c5721c3ab@mailmaxy.one',
                           'e0aa7b18ec@mailmaxy.one',
                           '046shjb0n4@spymail.one',
                           'alanda.steiger@mailmagnet.co',
                           '3169a48b93@mailmaxy.one',
                           'ifbymhhwh@emlhub.com',
                           'a9c9c20c6c@mailmaxy.one',
                           'agdrliegv@yomail.info',
                           'lonita.keena@solarnyx.com',
                           'd1dba6fe9b@mailmaxy.one',
                           'bmhcqhhwh@emlhub.com',
                           'f7dbe987ad@mailmaxy.one',
                           'agbnvarewuzepv@dropmail.me',
                           'borismaksimovlr9931@rambler.ru',
                           'y2s53wrj@minimail.gq',
                           '2b07a7c256@mailmaxy.one',
                           'fedorov2012valik50855h@myrambler.ru',
                           '4fb5b4edae@mailmaxy.one',
                           '04ewwbpfm4@freeml.net',
                           'igorpavlovqu2311@rambler.ua',
                           '9a6909044c@mailmaxy.one',
                           'agdrlvvbo@yomail.info',
                           '0b27506d48@mailmaxy.one',
                           'kozlov99roman86755q@myrambler.ru',
                           'kenyun.ulland@allwebemails.com',
                           'agdrlzhzu@yomail.info',
                           'maksromanovjq1503@rambler.ru',
                           'xmdvnzj9@flymail.tk',
                           'z0b1dimak1k3@10mail.xyz',
                           '08f726528a@mailmaxy.one',
                           'ayania.raglin@inboxorigin.com',
                           'agbnvqebaxebfi@dropmail.me',
                           'htspdwuj@autorambler.ru',
                           'agbnvtbiulovoe@dropmail.me',
                           'agbnvvztdbelin@dropmail.me',
                           'munha.shuff@solarnyx.com',
                           'nikolajnikitinau9083@rambler.ua',
                           '046sjt5j3m@spymail.one',
                           'ahhsfdrdw@10mail.org',
                           'njmzwhlxq@autorambler.ru',
                           'keinya.besser@easymailer.live',
                           'bjdlhayig@laste.ml',
                           'y2scd19k@minimail.gq',
                           'slastena866@mail.ru',
                           'dkoekihwh@emlhub.com',
                           'lehan.maul@openmail.pro',
                           'cfdkoghzh@emlpro.com',
                           'slavarodionovmt3990@rambler.ua',
                           'yltvbzgaj@emltmp.com',
                           'agbnwgsztrgueg@dropmail.me',
                           'johnedwards4821@rambler.ru',
                           'gig.gurney@openmail.pro',
                           '046skd6j4c@spymail.one',
                           'f560de5c9a@mailmaxy.one',
                           'jaqeuayig@laste.ml',
                           'y2sfvvan@minimail.gq',
                           'haifa.elias@horizonspost.com',
                           'vkozxayig@laste.ml',
                           'agbnwqixuuqwql@dropmail.me',
                           'poljakov2010denis34751d@myrambler.ru',
                           'qualik.canney@inboxorigin.com',
                           'vzzfabyig@laste.ml',
                           'xdbpnzgaj@emltmp.com',
                           'ahhvsvgje@10mail.org',
                           'kingsten.seabury@solarnyx.com',
                           'z0b1d1g0z1k3@10mail.xyz',
                           'ahhvsyiqk@10mail.org',
                           'hesper.reasons@solarnyx.com',
                           'hxveejhwh@emlhub.com',
                           'xmea92ce@flymail.tk',
                           'baela.archambeault@horizonspost.com',
                           'xmeb766j@flymail.tk',
                           'zrkwhjhwh@emlhub.com',
                           'osipov99valentin09657k@myrambler.ru',
                           'tynaya.lapp@openmail.pro',
                           'xmecrvpp@flymail.tk',
                           'y2srcb0r@minimail.gq',
                           'cirila.salisbury@openmail.pro',
                           'jrbtrhhzh@emlpro.com',
                           'ahhvttdid@10mail.org',
                           'dazyzyweled2@10mail.xyz',
                           'sharnise.calton@inboxorigin.com',
                           'xmeh8n2h@flymail.tk',
                           'agbnxegveddtnp@dropmail.me',
                           'nataleigh.slocum@solarnyx.com',
                           'xmejey06@flymail.tk',
                           'sifunit0dug3@10mail.xyz',
                           'unqwgfqvdo@rambler.ru',
                           'alara.haughton@allwebemails.com',
                           'quvdqahaj@emltmp.com',
                           'dsidccyig@laste.ml',
                           'xksmaa5h@flymail.tk',
                           'presleigh.bilbo@allfreemail.net',
                           'mihajlov99valik35876g@myrambler.ru',
                           'ahhvunpyr@10mail.org',
                           'ffmykihzh@emlpro.com',
                           'knv2927@nicevt.ru',
                           'valiere.robb@openmail.pro',
                           'oiewhkhwh@emlhub.com',
                           '04ezmwmzyr@freeml.net',
                           'aaziyah.lemmons@inboxorigin.com',
                           '046sp8see8@spymail.one',
                           'gavrilov2011vanja52446i@myrambler.ru',
                           'agbnzeoicxyapo@dropmail.me',
                           'kemond.held@openmail.pro',
                           'lkpbscyig@laste.ml',
                           'bueddqqzsv@rambler.ru',
                           'z1b1mym1g1l3@10mail.xyz',
                           'medvedev2012leha86417q@myrambler.ru',
                           'nuwsxihzh@emlpro.com',
                           'shishova@chimmed.ru',
                           'yadon.mcpeek@inboxorigin.com',
                           'agbnzsebyoouge@dropmail.me',
                           '046spyhdk8@spymail.one',
                           'willah.lara@inboxorigin.com',
                           'wrqudjhzh@emlpro.com',
                           'hkgflbuqfi@rambler.ru',
                           'tolikabramovfw3214@rambler.ua',
                           'tarasovviktorcs7237@rambler.ru',
                           'vladimirkarpovmy9531@rambler.ua',
                           'voronin9viktor79118s@myrambler.ru',
                           'zeguhkvydf@rambler.ru',
                           'fedorov2012artem51083v@myrambler.ru',
                           'davydov2010vladimir74787l@myrambler.ru',
                           'egorov99aleksej13739l@myrambler.ru',
                           'ponomarev2010artur13691k@myrambler.ru',
                           'nikolajivanovrm3111@rambler.ua',
                           'petrov2012dmitrij21947c@myrambler.ru',
                           'david@qzueos.com',
                           'vovatitovlb3997@rambler.ua',
                           'zaharov9nikita52685m@myrambler.ru',
                           'smirnov2011dima45645x@myrambler.ru',
                           'igordenisovtt7405@rambler.ua',
                           'gerasimov99aleksandr32495q@myrambler.ru',
                           'evgenijmakarovvk0323@rambler.ua',
                           'rplmbrzgz@autorambler.ru',
                           'grishasokolovqx1678@rambler.ua',
                           'antonov2011roma20989l@myrambler.ru',
                           'konstantinsmirnovyz7939@rambler.ua',
                           'olegdenisovmx1488@rambler.ua',
                           'nikitatihonovss2586@rambler.ua',
                           'mironov2012konstantin29405g@myrambler.ru',
                           'kazakov2010valentin55341q@myrambler.ru',
                           'vitalikbaranovai7060@rambler.ua',
                           'artemsergeevmr4913@rambler.ua',
                           'vitalijkarpovpo1509@rambler.ua',
                           'taraspoljakovzv5357@rambler.ua'
            )

    `
    return {}
  }

  async createFile(
    path: string,
    fileName: string,
    data: string,
  ): Promise<void> {
    // if (!this.checkIfFileOrDirectoryExists(path)) {
    //   fs.mkdirSync(path);
    // }

    const writeFiles = promisify(writeFile);

    return await writeFiles(`${path}/${fileName}`, data, 'utf8');
  }

  async findManyUsersByName(name: string): Promise<any> {
    return this.dbService.user.findMany({
      take: 10,
      orderBy: {
        videoLikes: {
          _count: 'desc'
        }
      },
      where: {
        name: {
          contains: name
        }
      },
      include: {
        videoLikes: {
          select: {
            id: true,
            video_id: true,
            user: {
              select: {
                id: true,
              },
            },
          },
        }
      }
    })
  }

  async findFirstSongById(id: number): Promise<any> {
    const song = "https://firebasestorage.googleapis.com/v0/b/testing-98cd8.appspot.com/o/images%2F1725226282184?alt=media&token=5c0ccc8f-f8d1-4c65-8385-e21b695de6cb"
    const readStream = createReadStream(song)
    return new StreamableFile(readStream)
    return this.dbService.song.findFirst({
      where: {
        id: id
      }
    })
  }

}
